import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { imagesBase64, specialNote } = await req.json();

        if (!imagesBase64 || imagesBase64.length === 0) {
            return NextResponse.json({ success: false, message: 'কোনো ছবি পাওয়া যায়নি!' }, { status: 400 });
        }

        const imageParts = imagesBase64.map((img: string) => {
            const base64Data = img.split(',')[1];
            const mimeType = img.substring(img.indexOf(':') + 1, img.indexOf(';'));
            return {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            };
        });

        const prompt = `You are a medical prescription reader. Analyze the given prescription image(s) and extract the prescribed medicines.
        Return the result strictly as a JSON object with this format:
        {
            "items": [
                {
                    "name": "Medicine Name with strength (e.g., Napa Extra 500mg)",
                    "dosage": "e.g., 1+0+1",
                    "duration": "e.g., 5 days",
                    "instructions": "e.g., After meal"
                }
            ]
        }
        Special note from user: ${specialNote || 'None'}`;

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });

        const result = await model.generateContent([...imageParts, prompt]);
        const response = await result.response;
        const textResponse = response.text();
        const parsedData = JSON.parse(textResponse || '{}');

        return NextResponse.json({
            success: true,
            items: parsedData.items || [],
        });
    } catch (error: any) {
        console.error('Prescription Scan Error:', error);
        return NextResponse.json({ success: false, message: 'প্রেসক্রিপশন স্ক্যান করতে ব্যর্থ হয়েছে।' }, { status: 500 });
    }
}
