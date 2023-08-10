FROM denoland/deno:alpine

EXPOSE 8000

WORKDIR /deno-dir

USER deno

COPY . .
RUN deno compile --allow-net --allow-env --output javadoc-publish main.ts

CMD ["./javadoc-publish"]
