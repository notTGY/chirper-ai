from transformers import pipeline

generator = pipeline("text-generation", model="roneneldan/TinyStories-Instruct-28M")


if __name__ == "__main__":
  import argparse
  parser = argparse.ArgumentParser()
  parser.add_argument('--prompt', type=str, default="Summary: girl bought an ice cream\n")
  parser.add_argument('--max_new_tokens', type=int, default=100)
  args = parser.parse_args()
  res = generator(args.prompt, max_new_tokens=args.max_new_tokens, pad_token_id=50256)
  print(res[0]["generated_text"])
