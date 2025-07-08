FROM denoland/deno:alpine-1.40.2

WORKDIR /app
COPY ./functions /app/functions

EXPOSE 8000

CMD [ "deno", "run", "--allow-net", "--allow-env", "--allow-read", "/app/functions/auth/index.ts" ]
