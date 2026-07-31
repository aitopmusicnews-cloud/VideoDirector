from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from llama_cpp import Llama

app = FastAPI(title="Local Music Video AI Server")

# 1. GLOBAL CORS MIDDLEWARE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the Mistral Model (Forced CPU deployment to prevent hardware driver panics)
llm = Llama(
    model_path="/Users/admin/Downloads/mistral-7b-instruct-v0.2.Q4_K_M.gguf",
    n_ctx=4096,
    n_threads=4,
    n_gpu_layers=0, #  Forced back to 0 to completely shield your AMD R9 GPU from driver crashes
    verbose=True     
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.85
    max_tokens: Optional[int] = 800


@app.post("/v1/chat/completions")
async def chat_completions(body: ChatRequest):
    """
    OpenAI-compatible chat completion endpoint formatted specifically
    for Mistral-7B-Instruct syntax without duplicate BOS tokens.
    """
    
    # 2. MISTRAL INSTRUCT PROMPT FORMATTING (FIXED DUPLICATE BOS)
    prompt = "" # ──> Clear empty string. llama-cpp-python auto-prepends <s> automatically.
    system_prompt = ""
    
    for msg in body.messages:
        if msg.role == "system":
            system_prompt = f"{msg.content}\n\n"
            break

    for msg in body.messages:
        if msg.role == "user":
            prompt += f"[INST] {system_prompt if system_prompt else ''}{msg.content} [/INST]"
            system_prompt = "" 
        elif msg.role == "assistant":
            prompt += f" {msg.content} </s>"

    # Inferencing through llama.cpp
    response = llm(
        prompt,
        max_tokens=body.max_tokens,
        temperature=body.temperature,
        stop=["</s>", "[INST]"]
    )

    generated_text = response['choices'][0]['text'].strip()

    return {
        "choices": [{
            "message": {
                "role": "assistant",
                "content": generated_text
            }
        }]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint to verify server is running."""
    return {"status": "healthy", "model": "mistral-7b-instruct-v0.2.Q4_K_M.gguf"}

if __name__ == "__main__":
    print("🚀 Local AI Server is starting...")
    print("Waiting for requests at http://127.0.0.1:8005")
    print("\nMake sure the model file exists at: /Users/admin/Downloads/mistral-7b-instruct-v0.2.Q4_K_M.gguf")
    uvicorn.run(app, host="127.0.0.1", port=8005)