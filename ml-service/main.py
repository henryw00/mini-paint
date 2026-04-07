import torch
import numpy as np
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import io

from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler
from controlnet_aux import CannyDetector

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global pipeline — loaded once on startup
pipe = None
canny = None

@app.on_event("startup")
async def load_models():
    global pipe, canny

    print("Loading ControlNet model...")
    controlnet = ControlNetModel.from_pretrained(
        "lllyasviel/sd-controlnet-canny",
        torch_dtype=torch.float16
    )

    print("Loading Stable Diffusion pipeline...")
    pipe = StableDiffusionControlNetPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        controlnet=controlnet,
        torch_dtype=torch.float16,
        safety_checker=None
    )

    pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)
    pipe.enable_model_cpu_offload()

    canny = CannyDetector()
    print("Models loaded and ready.")

@app.get("/health")
def health():
    return {
        "status": "ok",
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "none",
        "vram_free_gb": round(torch.cuda.mem_get_info()[0] / 1e9, 2) if torch.cuda.is_available() else 0
    }

@app.post("/generate")
async def generate(
    image: UploadFile = File(...),
    prompt: str = Form(...),
    negative_prompt: str = Form(default="blurry, bad quality, deformed"),
    strength: float = Form(default=0.8),
    guidance_scale: float = Form(default=7.5),
    steps: int = Form(default=20),
):
    # Load and resize image
    contents = await image.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    img = img.resize((512, 512))

    # Extract edges with Canny
    control_image = canny(img)

    # Run the pipeline
    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        image=control_image,
        num_inference_steps=steps,
        guidance_scale=guidance_scale,
    ).images[0]

    # Return as PNG
    buf = io.BytesIO()
    result.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")