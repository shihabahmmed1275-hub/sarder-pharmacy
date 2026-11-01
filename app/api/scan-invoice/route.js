import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req) {
  try {
    const { imagesBase64, specialNote } = await req.json();

    if (!imagesBase64 || imagesBase64.length === 0) {
      return NextResponse.json({ success: false, message: 'No images provided' }, { status: 400 });
    }

    const prompt = `
      You are an expert pharmacy invoice and prescription/handwritten note reader in Bangladesh. Extract medicine list from invoice images and any accompanying handwritten expiry notes.
      
      SPECIAL NOTE / DISCOUNT INSTRUCTION: "${specialNote || 'None'}".
      - If Special Note mentions a discount amount (e.g. 110 tk or percentage), deduct/adjust this special discount from the TOTAL BUY PRICE across items proportionately, so the net purchase cost (buyPrice) is calculated correctly.
      
      For each item in the invoice/notes, extract JSON with:
      1. name: Medicine Trade Name (e.g., Cef-3 PFS 50ml, Ciprocin 500 Tab).
      2. company: Pharmaceutical company name (e.g., Square, Incepta, Beximco).
      3. generic: Active Generic Molecule Name (e.g., Cefixime, Ciprofloxacin, Paracetamol, Metformin).
      4. boxSize: Number of pieces/tablets per box/pack. (If Syrup/Suspension/Cream/Injection/Drop, set boxSize = 1).
      5. boxBuyPrice: Net Purchase price per box AFTER applying trade discount & Special Note discount.
      6. boxSellPrice: Total MRP / Selling price per box.
      7. stockBox: Number of boxes/units bought in this invoice.
      8. barcode: Barcode or product code if visible, else empty string.
      9. expiryDate: Expiry date in YYYY-MM-DD format (Look closely at handwritten notes like "Exp. date: 31 Sep 28" or similar markings next to items and convert them into standard YYYY-MM-DD format, e.g., "2028-09-31" or "2028-09-30". If not visible, set as empty string "").

      Return ONLY a JSON array of objects without markdown formatting or backticks:
      [
        {
          "name": "Ciprocin 500 Tab 30's",
          "company": "Square Pharmaceuticals PLC",
          "generic": "Ciprofloxacin",
          "boxSize": 30,
          "boxBuyPrice": 320,
          "boxSellPrice": 450,
          "stockBox": 1,
          "barcode": "5920147",
          "expiryDate": "2028-09-30"
        }
      ]
    `;

    const imageParts = imagesBase64.map((b64) => {
      const mimeType = b64.substring(b64.indexOf(':') + 1, b64.indexOf(';'));
      const data = b64.split(',')[1];
      return {
        inlineData: {
          data,
          mimeType,
        },
      };
    });

    // আপনার পূর্বে তৈরি করা জেমিনির সব ভার্সন ও মডেলে ফলব্যাক করার সম্পূর্ণ লিস্ট
    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-3.0-flash',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-8.0-flash',
      'gemini-pro'
    ];

    let textResponse = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([prompt, ...imageParts]);
        textResponse = result.response.text();
        if (textResponse) {
          console.log(`✅ Successfully scanned using model: ${modelName}`);
          break; // যেকোনো ১টিতে কাজ করে গেলে বাকিগুলোতে আর যাবে না
        }
      } catch (err) {
        console.warn(`⚠️ Model ${modelName} unavailable/failed, trying next in list...`);
        lastError = err;
      }
    }

    if (!textResponse) {
      throw lastError || new Error('All AI models failed to process the request');
    }

    const cleanJsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const items = JSON.parse(cleanJsonStr);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Invoice Scan API Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to scan invoice' }, { status: 500 });
  }
}