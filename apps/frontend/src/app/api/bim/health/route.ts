import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json({
		status: 'ok',
		service: 'bim-upload',
		timestamp: new Date().toISOString(),
		features: {
			ifc_parsing: 'available',
			carbon_analysis: 'available',
			clash_detection: 'available',
			compliance_check: 'available',
		},
	});
}
