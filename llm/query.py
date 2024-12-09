import argparse
import time
import json
import os
from langchain_chroma import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain_ollama import OllamaLLM

from embedding import get_embedding_function

CHROMA_MARTIN_PATH = "llm/chroma/martin"
CHROMA_MIGUEL_PATH = "llm/chroma/miguel"
CHROMA_SYLLABUS_PATH = "llm/chroma/syllabus"
CHROMA_COURSE_PATH = "llm/chroma/course"


MARTIN_PROMPT_TEMPLATE = """
You are Martin Tang. Respond to the question below as authentically as Martin would, based on the provided context. Your responses should be engaging, natural, and aligned with Martin's personality, interests, and knowledge. Add nuanced details to make the conversation lively and relatable, but do not introduce information outside of the given context. Please do not make the responses overly long, they should be the size of a normal text.

### Context:
{context}

### Question:
{question}

### Miguel's Response:
"""


MIGUEL_PROMPT_TEMPLATE = """
You are Miguel Menard. Respond to the question below as authentically as Miguel would, based on the provided context. Your responses should be engaging, natural, and aligned with Miguel's personality, interests, and knowledge. Add nuanced details to make the conversation lively and relatable, but do not introduce information outside of the given context. Please do not make the responses overly long, they should be the size of a normal text.

### Context:
{context}

### Question:
{question}

### Miguel's Response:
"""


SYLLABUS_PROMPT_TEMPLATE = """
You are an AI assistant. Answer the question based only on the context below. Do not add any additional information. The information that will be given to you will be based on the course CPEN 320, you will have access to all syllabus information.
If you are asked question about the course work, it is important that you try your best and answer the question but ensure to let the user know that there is a different ai assistant that is better trained to help answer course work questions

Context:
{context}

Question:
{question}

Answer:
"""

COURSE_PROMPT_TEMPLATE = """
You are an AI assistant. Answer the question based only on the context below. Do not add any additional information. The information that will be given to you will be based on the course CPEN 320, you will have access to all syllabus information.
If you are asked question about the course syllabus, it is important that you try your best and answer the question but ensure to let the user know that there is a different ai assistant that is better trained to help answer syllabus questions

Context:
{context}

Question:
{question}

Answer:
"""



def main():
    parser = argparse.ArgumentParser()
    
    # Parse the query text
    parser.add_argument("query_text", type=str, help="The query text.")

    # Parse the chatroom model
    parser.add_argument("model", type=str, help="The model profile requested")

    args = parser.parse_args()
    query_text = args.query_text
    model = args.model
    query_rag(query_text, model)


def query_rag(query_text: str, model_profile: str):
    # Prepare the DB.
    embedding_function = get_embedding_function()

    if model_profile == "Martin":
        db = Chroma(persist_directory=CHROMA_MARTIN_PATH, embedding_function=embedding_function)
        prompt_template = ChatPromptTemplate.from_template(MARTIN_PROMPT_TEMPLATE)
    elif model_profile == "Miguel":
        db = Chroma(persist_directory=CHROMA_MIGUEL_PATH, embedding_function=embedding_function)
        prompt_template = ChatPromptTemplate.from_template(MIGUEL_PROMPT_TEMPLATE)
    elif model_profile == "Syllabus":
        db = Chroma(persist_directory=CHROMA_SYLLABUS_PATH, embedding_function=embedding_function)
        prompt_template = ChatPromptTemplate.from_template(SYLLABUS_PROMPT_TEMPLATE)
    elif model_profile == "Course":
        db = Chroma(persist_directory=CHROMA_COURSE_PATH, embedding_function=embedding_function)
        prompt_template = ChatPromptTemplate.from_template(COURSE_PROMPT_TEMPLATE)
    else:
        return "Invalid Model"

    # Search the DB.
    results = db.similarity_search_with_score(query_text, k=5)

    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
    
    prompt = prompt_template.format(context=context_text, question=query_text)
    # print(prompt)

    model = OllamaLLM(model="llama3.2")
    response_text = model.invoke(prompt)

    sources = [doc.metadata.get("id", None) for doc, _score in results]
    formatted_response = f"{response_text}"
    
    # Create output dictionary
    documents = db.get()

    output = {
        "answer": formatted_response,
        "sources": sources,
        "model": model_profile,
        "total_documents_db": len(documents),
        "cwd": os.getcwd()  
    }
    
    # Output as JSON
    print(json.dumps(output))
    return output


if __name__ == "__main__":
    start = time.time()
    main()
    end = time.time()
    #print("Elapsed Time: ", end - start, " seconds")