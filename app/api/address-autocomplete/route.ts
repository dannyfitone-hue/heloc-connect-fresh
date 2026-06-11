import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({results:[{label:"123 Main St, Irvine, CA 92618",street:"123 Main St",city:"Irvine",state:"CA",zip:"92618"}]})}
