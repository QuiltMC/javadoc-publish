import "std/dotenv/load.ts";

const s3Params = {
	endPoint: Deno.env.get("B2_ENDPOINT") || "",
	region: Deno.env.get("B2_REGION") || "",
	accessKey: Deno.env.get("B2_KEY"),
	secretKey: Deno.env.get("B2_SECRET"),
	bucket: Deno.env.get("B2_BUCKET"),
	pathStyle: false
};

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
	const regex = /\/([^\/]+)\/([^\/]+)\/([^\/]+)/
	const found = url.pathname.match(regex);

	if (found === null) {
		return new Response("Invalid path", { status: 400 });
	}

	const worker = new Worker(new URL("./worker.ts", import.meta.url).href, { type: "module" });
	const [, name, mcVersion, libVersion] = found;
	const prefix = `${name}/${mcVersion}/${libVersion}`;
	const body = new Uint8Array(await req.arrayBuffer());

	worker.postMessage({ body, prefix, s3Params });

	return new Response("Uploading");
}

Deno.serve(handleRequest);
