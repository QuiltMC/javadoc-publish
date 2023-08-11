/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import { S3Client } from "s3/mod.ts";
import { Uint8ArrayReader, ZipReader } from "zip/index.js";

self.onmessage = async (event) => {
	const { body, prefix, s3Params } = event.data;
	const reader = new ZipReader(new Uint8ArrayReader(body));
	const s3 = new S3Client(s3Params);

	console.log("Uploading", prefix);
	for await (const entry of reader.getEntriesGenerator()) {
		if (!entry.directory && entry.getData !== undefined) {
			const stream = new TransformStream();
			entry.getData(stream.writable);
			await s3.putObject(`${prefix}/${entry.filename}`, stream.readable);
		}
	}

	console.log("Finished uploading", prefix);
	self.close();
};
