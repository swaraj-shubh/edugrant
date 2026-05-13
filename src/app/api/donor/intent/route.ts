// src/app/api/donor/intent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import clientPromise from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const donationIntentSchema: Schema = {
  type: SchemaType.OBJECT,
  description: "Parse a donation command into structured data.",
  properties: {
    amount: {
      type: SchemaType.NUMBER,
      description: "Amount of USDC to donate.",
    },
    targetType: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["specific", "all_students", "student_of_college", "student_of_department"],
      description: "Who the donation is for.",
    },
    targetIdentifier: {
      type: SchemaType.STRING,
      description: "Wallet address OR college name OR department name.",
    },
    isConfirmed: {
      type: SchemaType.BOOLEAN,
      description: "Whether the command is clear and actionable.",
    },
    confirmationMessage: {
      type: SchemaType.STRING,
      description: "A summary message explaining exactly what will happen.",
    },
  },
  required: ["amount", "targetType", "isConfirmed", "confirmationMessage"],
};

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: donationIntentSchema,
      },
    });

    const prompt = `Parse donation command: "${text}". For targetType: "specific" for single address, "all_students" for all, "student_of_college" for college name, "student_of_department" for department.`;
    const result = await model.generateContent(prompt);
    let intent = JSON.parse(result.response.text());

    // Resolve recipients from database
    let recipients: string[] = [];
    const client = await clientPromise;
    const db = client.db('edugrant');
    const studentsCollection = db.collection('users');

    switch (intent.targetType) {
      case 'specific':
        recipients = [intent.targetIdentifier];
        break;
      case 'all_students':
        const all = await studentsCollection.find({ role: 'student' }).project({ wallet: 1 }).toArray();
        recipients = all.map(s => s.wallet);
        break;
      case 'student_of_college':
        const byCollege = await studentsCollection.find({ role: 'student', college: { $regex: intent.targetIdentifier, $options: 'i' } }).project({ wallet: 1 }).toArray();
        recipients = byCollege.map(s => s.wallet);
        break;
      case 'student_of_department':
        const byDept = await studentsCollection.find({ role: 'student', department: { $regex: intent.targetIdentifier, $options: 'i' } }).project({ wallet: 1 }).toArray();
        recipients = byDept.map(s => s.wallet);
        break;
      default:
        recipients = [];
    }

    intent.recipients = recipients;
    intent.confirmationMessage += ` This will donate ${intent.amount} USDC to ${recipients.length} student(s).`;

    return NextResponse.json({ success: true, intent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to parse intent." }, { status: 500 });
  }
}