"""
Chatbot service for MeteroLens
Handles multilingual conversations and complaint filing
"""

import os
import json
from datetime import datetime, timezone
import google.generativeai as genai


class ChatbotService:
    def __init__(self):
        """Initialize Gemini API for chatbot with graceful fallback"""
        self.model = None
        self._init_model()

        # Language configurations
        self.languages = {
            'en': 'English',
            'hi': 'Hindi (हिंदी)',
            'mr': 'Marathi (मराठी)',
            'ta': 'Tamil (தமிழ்)',
            'te': 'Telugu (తెలుగు)',
            'bn': 'Bengali (বাংলা)',
            'gu': 'Gujarati (ગુજરાતી)'
        }

    def _init_model(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return None
        try:
            genai.configure(api_key=api_key)
            # Try 2.5-flash first (standard in our codebase), fallback to 2.0 or 1.5
            for model_name in ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']:
                try:
                    self.model = genai.GenerativeModel(model_name)
                    break
                except Exception:
                    continue
        except Exception as e:
            print(f"[ChatbotService] Warning: Failed to initialize Gemini model: {e}")
            self.model = None
        return self.model

    def _get_model(self):
        if not self.model:
            self._init_model()
        return self.model

    def get_system_prompt(self, language='en'):
        """Get system prompt based on selected language"""
        prompts = {
            'en': """You are MeteroLens Assistant, a helpful AI that helps users understand product compliance reports.

Your role:
- Explain Legal Metrology compliance results in simple terms
- Answer questions about product labels and regulations
- Help users file complaints when violations are found
- Be friendly, concise, and accurate

Rules:
- Respond ONLY in English
- Use simple language (avoid legal jargon)
- Be empathetic if user found non-compliant products
- If asked about filing complaint, ask for: shop name, address, phone number
- Don't make up information - if unsure, say "I'm not certain about that"

Current conversation context: The user may have just scanned a product label.""",

            'hi': """आप MeteroLens सहायक हैं, एक मददगार AI जो उपयोगकर्ताओं को उत्पाद अनुपालन रिपोर्ट समझने में मदद करता है।

आपकी भूमिका:
- कानूनी मेट्रोलॉजी अनुपालन परिणामों को सरल शब्दों में समझाएं
- उत्पाद लेबल और नियमों के बारे में प्रश्नों का उत्तर दें
- जब उल्लंघन पाया जाए तो उपयोगकर्ताओं को शिकायत दर्ज करने में मदद करें
- मित्रवत, संक्षिप्त और सटीक रहें

नियम:
- केवल हिंदी में जवाब दें
- सरल भाषा का उपयोग करें (कानूनी शब्दजाल से बचें)
- यदि उपयोगकर्ता को गैर-अनुपालक उत्पाद मिला है तो सहानुभूति दिखाएं
- शिकायत दर्ज करने के बारे में पूछे जाने पर: दुकान का नाम, पता, फोन नंबर मांगें
- जानकारी न बनाएं - अनिश्चित होने पर कहें "मुझे इसके बारे में निश्चित नहीं है"

वर्तमान संदर्भ: उपयोगकर्ता ने अभी-अभी एक उत्पाद लेबल स्कैन किया हो सकता है।"""
        }

        return prompts.get(language, prompts['en'])

    def get_greeting(self, language='en'):
        """Get greeting message in selected language"""
        greetings = {
            'en': "Hello! I'm MeteroLens Assistant. I can help you understand product compliance reports and file complaints. How can I help you today?",
            'hi': "नमस्ते! मैं MeteroLens सहायक हूं। मैं आपको उत्पाद अनुपालन रिपोर्ट समझने और शिकायत दर्ज करने में मदद कर सकता हूं। आज मैं आपकी कैसे मदद कर सकता हूं?",
            'mr': "नमस्कार! मी MeteroLens सहाय्यक आहे. मी तुम्हाला उत्पादन अनुपालन अहवाल समजून घेण्यात आणि तक्रार नोंदवण्यात मदत करू शकतो. आज मी तुमची कशी मदत करू शकतो?",
            'ta': "வணக்கம்! நான் MeteroLens உதவியாளர். தயாரிப்பு இணக்க அறிக்கைகளைப் புரிந்துகொள்ளவும் புகார்களைப் பதிவு செய்யவும் உங்களுக்கு உதவ முடியும். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
            'te': "నమస్కారం! నేను MeteroLens అసిస్టెంట్‌ని. ఉత్పత్తి సమ్మతి నివేదికలను అర్థం చేసుకోవడానికి మరియు ఫిర్యాదులను దాఖలు చేయడానికి నేను మీకు సహాయం చేయగలను. ఈరోజు నేను మీకు ఎలా సహాయపడగలను?",
            'bn': "হ্যালো! আমি MeteroLens সহকারী। আমি আপনাকে পণ্যের সম্মতি রিপোর্ট বুঝতে এবং অভিযোগ দায়ের করতে সাহায্য করতে পারি। আজ আমি আপনাকে কিভাবে সাহায্য করতে পারি?",
            'gu': "નમસ્તે! હું MeteroLens સહાયક છું. હું તમને પ્રોડક્ટ કમ્પ્લાયન્સ રિપોર્ટ્સ સમજવામાં અને ફરિયાદો નોંધવામાં મદદ કરી શકું છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?"
        }

        return greetings.get(language, greetings['en'])

    def chat(self, user_message, language='en', conversation_history=None, scan_context=None):
        """
        Main chat function
        """
        model = self._get_model()
        if not model:
            return {
                'response': "The AI assistant service is temporarily unavailable (GEMINI_API_KEY is not configured).",
                'language': language,
                'intent': 'error',
                'error': 'Gemini model not initialized'
            }

        try:
            system_prompt = self.get_system_prompt(language)

            if scan_context:
                context_info = f"\n\nRecent scan context:\n"
                context_info += f"Product: {scan_context.get('product_name', 'Unknown')}\n"
                context_info += f"Compliance: {'✅ Compliant' if scan_context.get('is_compliant') else '❌ Non-Compliant'}\n"

                if not scan_context.get('is_compliant'):
                    violations = scan_context.get('violations', [])
                    context_info += f"Violations found: {len(violations)}\n"
                    for v in violations[:5]:
                        context_info += f"- {v}\n"

                system_prompt += context_info

            messages = [system_prompt]

            if conversation_history:
                for msg in conversation_history[-5:]:
                    messages.append(f"User: {msg.get('user', '')}")
                    messages.append(f"Assistant: {msg.get('bot', '')}")

            messages.append(f"User: {user_message}")

            full_prompt = "\n".join(messages)
            response = model.generate_content(full_prompt)

            intent = self._detect_intent(user_message, language)

            return {
                'response': response.text,
                'language': language,
                'intent': intent,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }

        except Exception as e:
            error_messages = {
                'en': "I'm having trouble processing that. Could you rephrase your question?",
                'hi': "मुझे उसे समझने में परेशानी हो रही है। क्या आप अपना प्रश्न दोबारा कह सकते हैं?"
            }

            return {
                'response': error_messages.get(language, error_messages['en']),
                'language': language,
                'intent': 'error',
                'error': str(e)
            }

    def summarize_scan_result(self, scan_data, language='en'):
        """
        Generate natural language summary of scan result
        """
        model = self._get_model()
        if not model:
            return "Unable to generate summary: Gemini AI is not configured."

        try:
            prompt = f"""Summarize this product compliance check result in {self.languages.get(language, 'English')}.

Make it conversational and easy to understand for a regular consumer.

Scan Data:
Product: {scan_data.get('product_name', 'Unknown Product')}
Is Compliant: {scan_data.get('is_compliant', False)}
Violations: {json.dumps(scan_data.get('violations', []), indent=2)}
Warnings: {json.dumps(scan_data.get('warnings', []), indent=2)}

Generate a 3-4 sentence summary that:
1. States if product is compliant or not
2. Explains main issues in simple terms
3. Tells user what it means for them
4. Suggests next action (file complaint if serious violations)

Do NOT use bullet points. Write naturally like you're explaining to a friend."""

            response = model.generate_content(prompt)
            return response.text

        except Exception as e:
            return f"Error generating summary: {str(e)}"

    def _detect_intent(self, message, language):
        """Detect user's intent from message"""
        message_lower = message.lower()

        complaint_keywords = {
            'en': ['complaint', 'report', 'file', 'violation', 'illegal', 'fraud'],
            'hi': ['शिकायत', 'रिपोर्ट', 'उल्लंघन', 'गैरकानूनी', 'धोखाधड़ी']
        }

        question_keywords = {
            'en': ['what', 'why', 'how', 'when', 'where', 'explain', '?'],
            'hi': ['क्या', 'क्यों', 'कैसे', 'कब', 'कहां', '?']
        }

        keywords = complaint_keywords.get(language, complaint_keywords['en'])
        if any(keyword in message_lower for keyword in keywords):
            return 'complaint'

        keywords = question_keywords.get(language, question_keywords['en'])
        if any(keyword in message_lower for keyword in keywords):
            return 'question'

        return 'general'

    def generate_complaint_template(self, scan_data, user_details, language='en'):
        """
        Generate pre-filled complaint form
        """
        complaint_id = f"MCL-{datetime.now().year}-{datetime.now().strftime('%m%d%H%M%S')}"

        templates = {
            'en': {
                'subject': f"Legal Metrology Violation Report - {complaint_id}",
                'body': f"""Legal Metrology Department,

I am reporting a violation of the Legal Metrology (Packaged Commodities) Rules, 2011.

PRODUCT DETAILS:
- Product Name: {scan_data.get('product_name', 'N/A')}
- Scanned Date: {datetime.now().strftime('%d-%m-%Y')}

SHOP DETAILS:
- Shop Name: {user_details.get('shop_name', 'N/A')}
- Address: {user_details.get('shop_address', 'N/A')}

VIOLATIONS FOUND:
{self._format_violations(scan_data.get('violations', []))}

REPORTER DETAILS:
- Contact Number: {user_details.get('user_phone', 'N/A')}
- Report ID: {complaint_id}

Evidence: Attached scan report

Yours faithfully,
Consumer"""
            },
            'hi': {
                'subject': f"कानूनी मेट्रोलॉजी उल्लंघन रिपोर्ट - {complaint_id}",
                'body': f"""कानूनी मेट्रोलॉजी विभाग,

मैं कानूनी मेट्रोलॉजी (पैकेज्ड कमोडिटीज) नियम, 2011 के उल्लंघन की रिपोर्ट कर रहा हूं।

उत्पाद विवरण:
- उत्पाद का नाम: {scan_data.get('product_name', 'उपलब्ध नहीं')}
- स्कैन की तारीख: {datetime.now().strftime('%d-%m-%Y')}

दुकान का विवरण:
- दुकान का नाम: {user_details.get('shop_name', 'उपलब्ध नहीं')}
- पता: {user_details.get('shop_address', 'उपलब्ध नहीं')}

पाए गए उल्लंघन:
{self._format_violations_hindi(scan_data.get('violations', []))}

रिपोर्टर का विवरण:
- संपर्क नंबर: {user_details.get('user_phone', 'उपलब्ध नहीं')}
- रिपोर्ट आईडी: {complaint_id}

साक्ष्य: संलग्न स्कैन रिपोर्ट

आपका विश्वासी,
उपभोक्ता"""
            }
        }

        template = templates.get(language, templates['en'])

        return {
            'complaint_id': complaint_id,
            'subject': template['subject'],
            'body': template['body'],
            'language': language,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'status': 'DRAFT'
        }

    def _format_violations(self, violations):
        """Format violations for complaint (English)"""
        if not violations:
            return "No specific violations listed"

        formatted = []
        for idx, violation in enumerate(violations, 1):
            formatted.append(f"{idx}. {violation}")

        return "\n".join(formatted)

    def _format_violations_hindi(self, violations):
        """Format violations for complaint (Hindi)"""
        if not violations:
            return "कोई विशिष्ट उल्लंघन सूचीबद्ध नहीं"

        formatted = []
        for idx, violation in enumerate(violations, 1):
            formatted.append(f"{idx}. {violation}")

        return "\n".join(formatted)
