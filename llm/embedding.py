import os
import shutil
import argparse
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema.document import Document


# Set up Local Ollama Embedding Model
# Link: https://ollama.com/blog/embedding-models
def get_embedding_function():
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    return embeddings

# Clear the embedding database
def clear_database(chroma_path):
    if os.path.exists(chroma_path):
        shutil.rmtree(chroma_path)
        print(f"Cleared Chroma database at: {chroma_path}")

# Load PDFs from a specified folder in DATA_PATH
def load_documents(folder_path):
    document_loader = PyPDFDirectoryLoader(folder_path)
    documents = document_loader.load()
    print(f"Loaded {len(documents)} documents from {folder_path}")
    return documents

# Break the document into chunks
def split_documents(documents: list[Document]):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=80,
        length_function=len,
        is_separator_regex=False,
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split into {len(chunks)} chunks.")
    return chunks

def add_to_chroma(chunks: list[Document], chroma_path: str):
    db = Chroma(
        persist_directory=chroma_path, 
        embedding_function=get_embedding_function()
    )
    print(f"Initialized Chroma database at {chroma_path}")
    
    # Calculate Page IDs
    chunks_with_ids = calculate_chunk_ids(chunks)

    # Add or Update the documents
    existing_items = db.get(include=[])  # IDs are always included by default
    existing_ids = set(existing_items["ids"])
    print(f"Number of existing documents in DB: {len(existing_ids)}")

    MAX_BATCH_SIZE = 5000  # Adjust this to stay below Chroma's limit

    # Only add new documents
    new_chunks = [chunk for chunk in chunks_with_ids if chunk.metadata["id"] not in existing_ids]
    if new_chunks:
        print(f"👉 Adding new documents: {len(new_chunks)}")
        
        # Process in batches
        for i in range(0, len(new_chunks), MAX_BATCH_SIZE):
            batch_chunks = new_chunks[i:i + MAX_BATCH_SIZE]
            batch_ids = [chunk.metadata["id"] for chunk in batch_chunks]
            
            try:
                # Add the batch to Chroma
                db.add_documents(batch_chunks, ids=batch_ids)
                print(f"✅ Successfully added batch {i // MAX_BATCH_SIZE + 1} with {len(batch_chunks)} chunks.")
            except Exception as e:
                print(f"❌ Error adding batch {i // MAX_BATCH_SIZE + 1}: {e}")
    else:
        print("✅ No new documents to add")


def calculate_chunk_ids(chunks):
    last_page_id = None
    current_chunk_index = 0

    for chunk in chunks:
        source = chunk.metadata.get("source")
        page = chunk.metadata.get("page")
        current_page_id = f"{source}:{page}"

        # If the page ID is the same as the last one, increment the index
        if current_page_id == last_page_id:
            current_chunk_index += 1
        else:
            current_chunk_index = 0

        # Calculate the chunk ID
        chunk_id = f"{current_page_id}:{current_chunk_index}"
        last_page_id = current_page_id

        # Add it to the page meta-data
        chunk.metadata["id"] = chunk_id

    return chunks

def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Reset all databases.")
    args = parser.parse_args()

    base_data_path = "data"
    base_chroma_path = "chroma"

    # Walk through all folders and subfolders in the data directory
    for root, dirs, files in os.walk(base_data_path):
        # Skip processing if the folder is empty
        if not files:
            continue

        # Set up the corresponding Chroma path based on the current folder
        relative_path = os.path.relpath(root, base_data_path)
        chroma_path = os.path.join(base_chroma_path, relative_path)

        # Clear the database if --reset flag is provided
        if args.reset:
            clear_database(chroma_path)

        # Process documents in the current folder
        print(f"Processing folder: {root}")
        documents = load_documents(root)
        chunks = split_documents(documents)
        add_to_chroma(chunks, chroma_path)

if __name__ == "__main__":
    main()
