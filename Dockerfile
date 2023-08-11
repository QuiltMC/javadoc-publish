FROM denoland/deno:alpine

EXPOSE 8000

WORKDIR /deno-dir

USER deno

COPY . .
RUN deno cache *.ts

CMD ["task", "start"]
