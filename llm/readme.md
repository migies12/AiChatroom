
**User Manual for AI Feature**

We created a locally hosted Retriveral Augmented Generation (RAG) system integrated with specific chatrooms where users can talk to their own data. This is easily done by generating embeddings on existing data and relying on similarity search as well as the chosen LLM to query relevant information within our vector database. This lets users chat to their own documents in depth which is not possible with modern chatrooms especially with security and privacy.

**AI Feature Design and Implementation**

For our AI feature, we opted for a fully locally hosted solution, relying on open-source frameworks such as LangChain, ChromaDB, and Ollama. Hosting everything locally ensures data privacy, better control, and reduced dependence on third-party services. For LLM hosting, we selected Ollama due to its user-friendly interface and access to high-performing models such as LLama 3.2 3B. This specific model was chosen because it is open source, lightweight, and provides robust capabilities comparable to proprietary solutions like OpenAI's GPT-4o and Anthropic's Claude Sonnet 3.

Our AI tech stack integrates the nomic-embed-text and Llama 3.2 3B models to balance scalability, performance, and usability. The nomic-embed-text model was selected for its extended context length of 8192 tokens, trainable weights of 137 million, and ability to efficiently capture complex patterns. While alternatives like OpenAI’s Ada embeddings and Sentence Transformers were considered, nomic-embed-text emerged as the optimal choice due to its open-source nature and compatibility with resource-limited environments.

Similarly, the Llama 3.2 3B model was adopted for its 128K token context window and its edge-enabled design, making it ideal for offline applications. Despite exploring alternatives such as Falcon and GPT-Neo, Llama 3.2 3B offered the best combination of performance and computational efficiency for our use case, especially in environments with limited hardware resources.

These models serve critical roles in delivering high-performance natural language processing and generation capabilities for tasks such as document analysis and conversational AI. Their integration is facilitated through LangChain, which handles document chunking, PDF loading, and seamless communication between the embeddings and language models, ensuring scalability and modularity.

For deployment, we incorporated ChromaDB as our vector database to store and retrieve embeddings efficiently. Its seamless integration with LangChain simplifies the connection between all components of the stack. Meanwhile, Ollama was chosen to locally host and execute the models, offering efficient resource utilization while ensuring data privacy. Together, this tech stack reflects our commitment to a robust, flexible, and privacy-conscious AI system that prioritizes both user needs and technical excellence.

**Set Up**
1. Download Python Dependencies
   - cd llm
   - pip install -r requirements.txt
2. View data to be embedded into our vector database. Each folder is their unique vector database collection
   - cd data
   - 4 collections - martin, miguel, syllabus, course
3. Generate embeddings for our database
   - python3 embedding.py
4. Query the embedding using python
   - python3 query.py "Put your user prompt here" "Which collection you want: martin, miguel, syllabus, course"
   - Example: python3 query.py "what is the marking criteria of CPEN 320" "course"
5. Start our server
   - nodemon server.js
6. Access the model tab and begin chatting with the desired chatroom
     
   
