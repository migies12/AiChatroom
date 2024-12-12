# AI Chatroom Project


## Overview  
The AI Chatroom is a communication platform integrating real-time user interaction with AI-driven functionality. It is designed to provide a highly modular and private environment for users to interact with specialized AI models tailored to specific knowledge bases using Retrieval Augmented Generation (RAG). Key features include:  

- **User Profiles and Chat:** Real-time communication on a locally hosted server, ensuring low latency and secure user interactions.  
- **Custom RAG Chatbots:** Retrieval-Augmented Generation chatbots capable of answering domain-specific queries, trained on user-provided datasets.  
- **Privacy-Centric Design:** All AI models, embeddings, and databases are hosted locally, ensuring data security and full control over sensitive information.  

### Technical Highlights  
- **Node.js Backend:** Facilitates robust server-side functionality, user authentication, and real-time messaging.  
- **MongoDB Database:** Manages user profiles, chatbot configurations, and interaction logs with flexibility and scalability.  
- **AI Integration:** Powered by Chroma - an open-source embedding database - and Oolama  - enabling efficient local deployment of large language models -.  
- **Custom LLMs:** Built with Llama 3.2 (3B parameters) and `nomic-embed-text` for creating high-quality embeddings with fine-tuned domain-specific knowledge.  
- **Scalability and Efficiency:** Supports lightweight, edge-compatible models with a maximum context length of 128k tokens, ideal for large documents or extended queries.  

This architecture empowers users to create, train, and interact with AI models entirely offline, offering a powerful, secure, and customizable platform for AI-driven communication.

---

## Setup  

### Prerequisites  
Ensure you have the following installed:  
- **Node.js** for running the server.  
- **Mongosh** for managing the MongoDB database.  
- **Python 3.8+** for AI model training and embedding generation.  

---

### Step 1: Install Server Dependencies  
1. Clone the repository to your local machine:
2. Navigate to the root folder of the project and install Node.js dependencies:


### Step 2: Install Python Requirements 
1. Navigate to the llm/ folder:
2. Install the required Python libraries:
   ``` pip install -r requirements.txt ```
 

### Step 3: Train Models
1. Prepare your data: Place the relevant training files into the llm/data/ folder. 
2. Train the embeddings and generate the Chroma database by running:
   ``` python embeddings.py ```
  This step will use the data in data/ to create embeddings and set up a Chroma database, which serves as the AI knowledge base.

### Step 4: Initialize the Database
1. Launch Mongosh to set up the local MongoDB database:
   ``` mongosh ```
2. Run the following scripts to initialize users, models, and data:
   ``` load("initdb.mongo");
       load("initUsers.mongo");
       load("initModels.mongo");
   ```

### Step 5: Run the Server
1. Navigate back to the root folder of the project.
2. Start the server:
   ``` node server.js ```
3. Open your browser and visit http://localhost:8000 to access the AI Chatroom!


---

## Creating and Training Your Own Model  

### Step 1: Add the Model to MongoDB
1. Open the initModels.mongo file.
2. Add a new entry with the name of the model you want to create. Save the file.

   
### Step 2: Modify the llm/query.py File
1. Open the llm/query.py file.
2. At the top of the file, create a new prompt template for your model. You can use the existing templates as examples.
3. Add the path to the Chroma database file for your new model, using the name you added in initModels.mongo.
4. In the query_rag() method in llm/query.py, add the name of your new model to ensure it is recognized by the system.

      
### Step 3: Add Training Data
1. Navigate to the llm/data/ folder.
2. Create a new directory with the exact name of your new model.
3. Place all the training data you want your model to use in this directory.


### Step 4: Train the Model
1. Run the following command in the llm/ directory to train your model:
   ``` python embeddings.py ```
 This will generate embeddings and update the Chroma database for your new model once you run ``` node server.js ``` once again


## Disclaimer  
This project was developed in the context of a CPEN course at the University of British Columbia (UBC).  
All features were implemented solely by Martin Tang and Miguel Ménard.  
All AI features of this project were created and designed independently, without supervision from UBC. Full creative direction and development were inspired solely by Martin Tang and Miguel Ménard, falling outside of the course guidelines.
