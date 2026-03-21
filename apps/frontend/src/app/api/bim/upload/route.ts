import { NextRequest, NextResponse } from 'next/server';

const IFC_HEADER = 'ISO-10303-21';
const IFC_FOOTER = 'END-ISO-10303-21';

function isValidIFC(content: Buffer): boolean {
	const header = content.toString('utf-8', 0, Math.min(100, content.length));
	return header.includes(IFC_HEADER);
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;

		if (!file) {
			return NextResponse.json(
				{ detail: 'No file provided. Please upload an IFC file.' },
				{ status: 400 }
			);
		}

		const buffer = Buffer.from(await file.arrayBuffer());

		if (!isValidIFC(buffer)) {
			return NextResponse.json(
				{ detail: 'Invalid file format. Only IFC files are accepted. File must contain ISO-10303-21 header.' },
				{ status: 400 }
			);
		}

		const file_id = `ifc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

		return NextResponse.json({
			status: 'success',
			file_id,
			filename: file.name,
			size: file.size,
			message: 'IFC file uploaded successfully. Ready for carbon analysis.',
		});
	} catch (error) {
		console.error('BIM upload error:', error);
		return NextResponse.json(
			{ detail: 'Failed to process upload. Please try again.' },
			{ status: 500 }
		);
	}
}
