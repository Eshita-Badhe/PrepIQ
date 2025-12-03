# backend/rag_local.py

import os
import json
import uuid
import tempfile

from sentence_transformers import SentenceTransformer
import faiss
from unstructured.partition.auto import partition

from config import supabase, STORAGE_BUCKET  # shared config (Supabase, etc.)

# -------------------------
# Local embedding model
# -------------------------
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
EMBED_DIM = 384  # all-MiniLM-L6-v2 output dim

print(f"🧠 Loading local embedding model: {MODEL_NAME}")
embed_model = SentenceTransformer(MODEL_NAME)

# -------------------------
# FAISS index paths
# -------------------------
FAISS_INDEX_PATH = "faiss_index.bin"
FAISS_META_PATH = "faiss_meta.json"


# -------------------------
# 1) Download from Supabase
# -------------------------
def download_file_from_supabase(path_in_bucket: str) -> str:
    print("➡️ download_file_from_supabase:", path_in_bucket)

    file_bytes = supabase.storage.from_(STORAGE_BUCKET).download(path_in_bucket)
    if not file_bytes:
        raise RuntimeError(f"Failed to download {path_in_bucket} from Supabase")

    _, ext = os.path.splitext(path_in_bucket)
    suffix = ext or ".bin"

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(file_bytes)
    tmp.flush()
    tmp.close()

    print("✅ Downloaded to temp file:", tmp.name)
    return tmp.name


# -------------------------
# 2) Partition & chunk
# -------------------------
def partition_and_chunk(local_path: str, title: str):
    """
    Use Unstructured to partition the doc and create simple title-based chunks.
    Returns list of chunks: [{"title": ..., "content": ...}, ...]
    """
    print("➡️ partition_and_chunk:", local_path)

    elements = partition(filename=local_path)
    print(f"✅ partition: got {len(elements)} elements")

    chunks = []
    current_title = title
    current_text = []

    for el in elements:
        txt = getattr(el, "text", "") or ""
        txt = str(txt).strip()
        if not txt:
            continue

        cat = getattr(el, "category", None)

        if cat == "Title":
            if current_text:
                chunks.append({
                    "title": current_title,
                    "content": "\n".join(current_text),
                })
                current_text = []
            current_title = txt
        else:
            current_text.append(txt)

    if current_text:
        chunks.append({
            "title": current_title,
            "content": "\n".join(current_text),
        })

    print(f"✅ chunking: built {len(chunks)} chunks")
    return chunks


# -------------------------
# 3) Local embeddings
# -------------------------
def embed_local(texts):
    """
    Use local sentence-transformers model to embed texts.
    Returns numpy array of shape (n, EMBED_DIM).
    """
    print("➡️ embed_local: num_texts =", len(texts))
    if not texts:
        return []

    embeddings = embed_model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    print("✅ local embeddings:", embeddings.shape[0], "vectors; dim =", embeddings.shape[1])
    return embeddings  # numpy array (n, d)


# -------------------------
# 4) FAISS index helpers
# -------------------------
def _load_faiss_index():
    if not os.path.exists(FAISS_INDEX_PATH) or not os.path.exists(FAISS_META_PATH):
        print("ℹ️ No existing FAISS index/meta, starting fresh.")
        index = faiss.IndexFlatIP(EMBED_DIM)  # cosine via inner product + normalized vectors
        meta = []
        return index, meta

    print("➡️ Loading existing FAISS index and metadata")
    index = faiss.read_index(FAISS_INDEX_PATH)
    with open(FAISS_META_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)
    print(f"✅ Loaded FAISS index with {index.ntotal} vectors, meta size {len(meta)}")
    return index, meta


def _save_faiss_index(index, meta):
    print("➡️ Saving FAISS index and metadata")
    faiss.write_index(index, FAISS_INDEX_PATH)
    with open(FAISS_META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False)
    print("✅ Saved FAISS index and metadata")


def build_or_update_faiss_index(username: str, title: str, path_in_bucket: str, chunks, embeddings):
    """
    Add new chunks + embeddings to the FAISS index and metadata.
    embeddings: numpy array (n, d)
    """
    print("➡️ build_or_update_faiss_index: chunks =", len(chunks))

    if not len(chunks) or embeddings is None or embeddings.shape[0] == 0:
        print("⚠️ No chunks or embeddings, skipping index update.")
        return

    # Normalize embeddings for cosine similarity (inner product)
    faiss.normalize_L2(embeddings)

    index, meta = _load_faiss_index()

    start_ntotal = index.ntotal

    # Build metadata entries
    new_meta = []
    for idx, chunk in enumerate(chunks):
        new_meta.append({
            "id": str(uuid.uuid4()),
            "username": username,
            "folder_title": title,
            "doc_path": path_in_bucket,
            "section_title": chunk["title"],
            "chunk_index": idx,
            "content": chunk["content"],
        })

    # Add to FAISS
    index.add(embeddings)
    meta.extend(new_meta)

    print(f"✅ FAISS index updated: {start_ntotal} -> {index.ntotal} vectors")
    _save_faiss_index(index, meta)

def search_faiss(username: str, folder_title: str | None, query_embedding, top_k: int = 5):
    """
    Search the FAISS index for nearest chunks.
    query_embedding: numpy array shape (d,)
    Returns list of metadata dicts for top_k results, filtered by user.
    """
    print("➡️ search_faiss for user:", username, "folder:", folder_title)

    if not os.path.exists(FAISS_INDEX_PATH) or not os.path.exists(FAISS_META_PATH):
        print("⚠️ No FAISS index/meta found.")
        return []

    index, meta = _load_faiss_index()
    if index.ntotal == 0:
        print("⚠️ FAISS index empty.")
        return []

    import numpy as np
    q = query_embedding.astype("float32")
    q = q.reshape(1, -1)
    faiss.normalize_L2(q)

    distances, indices = index.search(q, top_k)
    idxs = indices[0].tolist()
    ds = distances[0].tolist()

    results = []
    for rank, (i, d) in enumerate(zip(idxs, ds)):
        if i < 0 or i >= len(meta):
            continue
        m = meta[i]
        if m["username"] != username:
            continue
        # folder_title no longer used
        m_copy = dict(m)
        m_copy["score"] = float(d)
        results.append(m_copy)

    print("✅ search_faiss returned", len(results), "results after filtering")
    return results

# -------------------------
# 5) One-shot ingestion helper (for testing)
# -------------------------
def ingest_single_file(username: str, title: str, path_in_bucket: str):
    """
    Full pipeline for a single file:
    Supabase -> temp file -> Unstructured -> local embeddings -> FAISS index.
    """
    print("\n==============================")
    print("🚀 ingest_single_file START")
    print("user:", username, "title:", title, "path:", path_in_bucket)

    local_path = download_file_from_supabase(path_in_bucket)
    chunks = partition_and_chunk(local_path, title)
    if not chunks:
        print("❌ No chunks produced.")
        return

    texts = [c["content"] for c in chunks]
    embeddings = embed_local(texts)
    build_or_update_faiss_index(username, title, path_in_bucket, chunks, embeddings)

    print("✅ ingest_single_file DONE")


if __name__ == "__main__":
    # Example manual test
    ingest_single_file(
        username="Esha_CC",
        title="CM51207_CLOUD COMPUTING",
        path_in_bucket="Esha_CC/CM51207_CLOUD COMPUTING.pdf",
    )
