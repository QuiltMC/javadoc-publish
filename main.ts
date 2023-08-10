import { S3Client } from "s3/mod.ts";
import { ZipReader } from "zip/index.js"

const s3 = new S3Client({
	endPoint: Deno.env.get("B2_ENDPOINT") || "",
	region: Deno.env.get("B2_REGION") || "",
	accessKey: Deno.env.get("B2_KEY"),
	secretKey: Deno.env.get("B2_SECRET"),
	bucket: Deno.env.get("B2_BUCKET"),
	pathStyle: false
});

async function handleRequest(req: Request): Promise<Response> {
	const auth = req.headers.get("Authorization");
	if (auth === null || !auth.startsWith("Bearer")) {
		return new Response("Not authorized", { status: 403 });
	}

	const token = auth.slice(7);
	if (token !== Deno.env.get("TOKEN")) {
		return new Response("Not authorized", { status: 403 });
	}

	if (req.body === null) {
		return new Response("Empty body", { status: 400 });
	}

	const url = new URL(req.url);
	const regex = /^\/repository\/release\/org\/quiltmc\/([^\/]+)\/([^\/]+)\+([^\/]+)\/(.*)$/
	const found = url.pathname.match(regex);

	if (found === null) {
		return new Response("Invalid path", { status: 400 });
	}

	const [, name, mcVersion, libVersion] = found;
	const reader = new ZipReader(req.body);
	const prefix = `${name}/${mcVersion}/${libVersion}/`;

	for await (const entry of reader.getEntriesGenerator()) {
		if (!entry.directory && entry.getData !== undefined) {
			const stream = new TransformStream();
			entry.getData(stream.writable);
			await s3.putObject(prefix + entry.filename, stream.readable);
		}
	}

	return new Response("Uploaded!");
}

Deno.serve(handleRequest);
