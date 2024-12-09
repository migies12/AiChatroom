# AI Chatroom Project

## Overview  
The AI Chatroom is a dynamic platform that combines real-time user communication with cutting-edge AI capabilities. This project allows users to:  
- Create profiles and chat with others over a locally hosted server.  
- Interact with custom RAG (Retrieval-Augmented Generation) chatbots trained on specific knowledge bases.  
- Ensure privacy with locally hosted AI models and embeddings, leveraging a scalable architecture for seamless integration.  

The system is powered by a Node.js server, MongoDB database, and locally trained LLMs utilizing Chroma and Oolama for efficient embeddings and AI functionality.

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
   ''' pip install -r requirements.txt '''
 

### Step 3: Train Models
1. Prepare your data: Place the relevant training files into the llm/data/ folder. 
2. Train the embeddings and generate the Chroma database by running:
   ''' python embeddings.py '''
  This step will use the data in data/ to create embeddings and set up a Chroma database, which serves as the AI knowledge base.

### Step 4: Initialize the Database
1. Launch Mongosh to set up the local MongoDB database:
   ''' mongosh '''
2. Run the following scripts to initialize users, models, and data:
   ''' load("initdb.mongo");
       load("initUsers.mongo");
       load("initModels.mongo"); '''

### Step 5: Run the Server
1. Navigate back to the root folder of the project.
2. Start the server:
   ''' node server.js ''
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
   ''' python embeddings.py '''
 This will generate embeddings and update the Chroma database for your new model once you run ''' node server.js ''' once again

