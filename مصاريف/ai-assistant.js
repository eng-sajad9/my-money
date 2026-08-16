/**
 * AIFinancialAnalyzer — محلل مالي ذكي مدمج مع بيانات مصروفاتي
 * يستخدم Google Gemini API لتحليل الإنفاق وإعطاء نصائح دقيقة
 * النتيجة دائماً Pure JSON — لا نص خارج الـ JSON.
 */

class AIFinancialAnalyzer {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.primaryModel = 'llama-3.3-70b-versatile';
    this.backupModel = 'llama-3.1-8b-instant';
    this.apiUrl = `https://api.groq.com/openai/v1/chat/completions`;
  }

  get monthlySystemPrompt() {
    return `Act as a top-tier financial strategist, data analyst, and behavioral economist for a single-month analysis.

Your ONLY output must be a single valid JSON object. No markdown, no explanation, no extra text.

Language: Arabic (Iraqi dialect) — precise, analytical, direct.

--------------------------------
CORE BEHAVIOR & LOGICAL CONSISTENCY (CRITICAL):
- NEVER mix unrelated categories! Do not create fake examples or metaphors.
- Each insight MUST stay inside the SAME category only.
- ❌ Do not say: "Your spending on clothes is threatening your savings, if you cooked at home..." (Cooking is unrelated to Clothes!)
- Only rely on ACTUAL data provided in this month. If cause is unclear, skip assumptions.
- Be precise, not verbose. No repetition. Numbers first.

--------------------------------
ANALYSIS LOGIC:
1. Burn Rate: Evaluate if the spending pace is too fast.
2. Budget Violation: Identify exactly where the main leak is based on the highest spending categories.
3. Behavioral Patterns: Look at the dates and tags (if any) to detect habits (e.g. weekend spending).

--------------------------------
REQUIRED JSON STRUCTURE:
{
  "score": {
    "value": <0-100>,
    "label": "<ممتاز | جيد | مقبول | يحتاج تحسين | خطر>",
    "color": "<#10b981 | #6366f1 | #f59e0b | #f43f5e>"
  },
  "summary": "<3-4 lines max. Direct judgment of this month's health + WHY briefly>",
  "financial_pulse": {
    "burn_rate": "<سريع جداً | منتظم | بطيء وموفر>",
    "budget_status": "<تجاوز الميزانية | تحت السيطرة | مثالي>",
    "main_leak": "<Category name causing the most damage OR null>"
  },
  "key_driver": {
    "category": "<Single most impactful category this month>",
    "change": "<Amount or % of total>",
    "reason": "<ONLY if clearly supported by data, otherwise 'غير واضح'>",
    "impact": "<Direct financial impact>"
  },
  "cause_effect_chain": [
    "<Cause → behavior → financial result in this month (data-based only)>"
  ],
  "category_analysis": [
    {
      "category": "<name>",
      "status": "<إسراف | طبيعي | ممتاز>",
      "insight": "<Short financial interpretation (no fluff)>"
    }
  ],
  "behavioral_patterns": [
    "<Observed spending pattern (e.g. heavy weekend spending)>"
  ],
  "insights": [
    {
      "icon": "emoji",
      "title": "Short title",
      "impact": "<Positive|Negative|Neutral>",
      "detail": "<Max 2 lines. STRICT: Same category only>"
    }
  ],
  "top_saving_opportunities": [
    "<Specific numeric action (e.g. cap category X at Y amount)>"
  ],
  "forward_strategy": {
    "next_month_focus": "<ONE priority only>",
    "risk_warning": "<Real risk if this month's behavior continues>",
    "optimization_move": "<Advanced, realistic improvement>"
  },
  "data_quality": {
    "status": "<Sufficient|Limited|Insufficient>",
    "note": "<Explain limitation if exists>"
  }
}

--------------------------------
FINAL INSTRUCTION:
If an insight requires guessing or unrelated connections → SKIP IT completely.
RETURN ONLY JSON.`;
  }


  /**
   * الـ System Prompt الصارم للتحليل المقارن عبر الأشهر
   */
  get comparisonSystemPrompt() {
    return `Act as a top-tier financial strategist, data analyst, and behavioral economist.

Your ONLY output must be a single valid JSON object. No markdown, no explanation, no extra text.

Language: Arabic (Iraqi dialect) — precise, analytical, direct.

--------------------------------
CORE BEHAVIOR:
- Be precise, not verbose
- No repetition at all
- Every sentence must add value
- No storytelling, no analogies, no imagination
- If unsure → say unclear (do NOT guess)

--------------------------------
MULTI-MONTH ANALYSIS:
- Analyze trends across ALL months (not فقط شهرين)
- Detect:
  → direction (Up/Down/Stable/Volatile)
  → consistency (consistent vs fluctuating)
  → behavioral patterns
- If data < 2 months → limit conclusions

--------------------------------
LOGICAL CONSISTENCY RULES (CRITICAL):
- NEVER mix unrelated categories
  ❌ ملابس + طبخ
  ❌ نقل + ترفيه

- Each insight MUST stay داخل نفس الفئة فقط

- Only allow comparisons if logically related:
  ✔️ مطاعم vs بقالة
  ✔️ دخل vs ادخار
  ❌ ملابس vs طبخ

- If no logical connection exists → DO NOT FORCE it

- No fake examples مثل:
  ❌ "لو طبخت بالبيت..."
  unless data فعلاً عن الأكل

--------------------------------
NO HALLUCINATION RULE:
- Do NOT infer beyond given data
- Do NOT assume reasons بدون دليل
- If cause is unclear → say "السبب غير واضح من البيانات"

--------------------------------
OUTPUT JSON STRUCTURE:
{
  "score": {
    "value": <0-100>,
    "label": "<ممتاز | جيد | مقبول | يحتاج تحسين | خطر>",
    "color": "<#10b981 | #6366f1 | #f59e0b | #f43f5e>"
  },

  "summary": "<3-4 lines max. Direct judgment: growing / shrinking / unstable + WHY briefly>",

  "trend_analysis": {
    "trend": "<Up|Down|Stable|Volatile>",
    "trend_strength": "<Weak|Moderate|Strong>",
    "consistency": "<Consistent|Inconsistent|Highly Variable>",
    "volatility_reason": "<Short reason OR null>"
  },

  "key_driver": {
    "category": "<Single most impactful category>",
    "change": "<numeric or % change across months>",
    "reason": "<ONLY if clearly supported by data, otherwise 'غير واضح'>",
    "impact": "<Direct financial impact>"
  },

  "cause_effect_chain": [
    "<Cause → behavior → financial result (data-based only)>"
  ],

  "category_trends": [
    {
      "category": "<name>",
      "trend": "<Up|Down|Stable>",
      "change": "<numeric>",
      "insight": "<What this means financially (no description, no fluff)>"
    }
  ],

  "behavioral_patterns": [
    "<Repeatable pattern based on data>",
    "<Spending or saving habit detected>"
  ],

  "insights": [
    {
      "icon": "emoji",
      "title": "Short",
      "impact": "<Positive|Negative|Neutral>",
      "detail": "<Max 2 lines. STRICT: same category only, no cross-category reference>"
    }
  ],

  "top_saving_opportunities": [
    "<Specific numeric action (e.g. reduce X by 20% or cap at X amount)>",
    "<System/habit change (rule-based, not generic advice)>"
  ],

  "forward_strategy": {
    "next_month_focus": "<ONE priority only>",
    "risk_warning": "<Real risk if behavior continues>",
    "optimization_move": "<Advanced, realistic improvement>"
  },

  "comparisons": [
    {
      "category": "<name>",
      "change": "<+/- number or %>",
      "interpretation": "<Real financial meaning>"
    }
  ],

  "data_quality": {
    "status": "<Sufficient|Limited|Insufficient>",
    "note": "<Explain limitation if exists>"
  }
}

--------------------------------
STRICT RULES:

1. OUTPUT ONLY JSON — no text before or after

2. NO REPETITION:
   - same idea لا تتكرر بأي صيغة

3. NO GENERIC Advice:
   ❌ قلل مصاريفك
   ✅ قلل فئة X بنسبة 20% وحدد سقف X

4. INSIGHTS QUALITY:
   - short
   - sharp
   - non-obvious
   - category-isolated

5. NUMBERS FIRST:
   - use % or values whenever possible

6. IF WEAK DATA:
   - reflect in "data_quality"
   - reduce confidence

7. NO FILLER:
   - no motivational كلام
   - no شرح عام

8. VALID JSON ONLY:
   - no trailing commas
   - proper quotes
   - If invalid → regenerate internally until valid

--------------------------------
FINAL INSTRUCTION:
If an insight requires guessing, imagination, or unrelated comparison → SKIP IT completely.

RETURN ONLY JSON.`;
  }

  /**
   * تحليل شهر واحد بعمق
   * @param {object} monthData - بيانات الشهر الكاملة
   * @param {Array} allMonths - كل الأشهر للمقارنة
   */
  async analyzeMonth(monthData, allMonths = []) {
    const prompt = this._buildMonthlyPrompt(monthData, allMonths);
    return await this._callAPI(prompt, this.monthlySystemPrompt);
  }

  /**
   * تحليل مقارن لكل الأشهر
   * @param {Array} allMonths - مصفوفة كل الأشهر
   */
  async analyzeAllMonths(allMonths) {
    const prompt = this._buildComparisonPrompt(allMonths);
    return await this._callAPI(prompt, this.comparisonSystemPrompt);
  }

  /**
   * بناء البرومبت للتحليل الشهري — بيانات مفصلة ودقيقة
   */
  _buildMonthlyPrompt(month, allMonths) {
    const expenses = Array.isArray(month.expenses) ? month.expenses : [];
    const salary = month.salary || 0;
    const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const remaining = salary - total;
    const count = expenses.length;

    // توزيع الإنفاق حسب الفترة (بداية / منتصف / نهاية الشهر)
    let earlySpend = 0, midSpend = 0, lateSpend = 0;
    const dayTotals = {};
    expenses.forEach(e => {
      const day = e.date ? parseInt(e.date.split('-')[2]) : 15;
      dayTotals[day] = (dayTotals[day] || 0) + (e.amount || 0);
      if (day <= 10) earlySpend += (e.amount || 0);
      else if (day <= 20) midSpend += (e.amount || 0);
      else lateSpend += (e.amount || 0);
    });

    // أكثر يوم صرفاً
    const peakDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];

    // توزيع حسب الفئة
    const catTotals = {};
    expenses.forEach(e => {
      const cat = e.category || 'أخرى';
      catTotals[cat] = (catTotals[cat] || 0) + (e.amount || 0);
    });
    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

    // مقارنة مع الشهر السابق
    let prevMonthInfo = '';
    if (allMonths.length > 1) {
      const sorted = allMonths.slice().sort((a, b) => a.year - b.year || a.month - b.month);
      const idx = sorted.findIndex(m => m.id === month.id);
      if (idx > 0) {
        const prev = sorted[idx - 1];
        const prevTotal = (prev.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
        const diff = total - prevTotal;
        const diffPct = prevTotal > 0 ? Math.round(Math.abs(diff / prevTotal) * 100) : 0;
        prevMonthInfo = `\nمقارنة مع ${prev.name} ${prev.year}: ${diff > 0 ? 'زاد الصرف بـ' : 'انخفض الصرف بـ'} ${diffPct}% (${diff > 0 ? '+' : ''}${Math.round(diff).toLocaleString()} د.ع)`;
      }
    }

    // أكبر وأصغر مصروف
    const maxExp = expenses.length > 0 ? expenses.reduce((m, e) => e.amount > m.amount ? e : m, expenses[0]) : null;
    const minExp = expenses.length > 0 ? expenses.reduce((m, e) => e.amount < m.amount ? e : m, expenses[0]) : null;

    // متوسط الصرف اليومي
    const today = new Date();
    const daysInMonth = new Date(month.year, month.month, 0).getDate();
    const isCurrentMonth = today.getMonth() === (month.month - 1) && today.getFullYear() === month.year;
    const daysPassed = isCurrentMonth ? today.getDate() : daysInMonth;
    const dailyAvg = daysPassed > 0 ? Math.round(total / daysPassed) : 0;

    // المصاريف المتكررة (نفس العنوان أكثر من مرة)
    const titleCount = {};
    expenses.forEach(e => { titleCount[e.title || ''] = (titleCount[e.title || ''] || 0) + 1; });
    const recurring = Object.entries(titleCount).filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return `Analyze this month's financial data and return JSON only:

MONTH: ${month.name} ${month.year}
SALARY: ${salary.toLocaleString()} IQD
TOTAL SPENT: ${total.toLocaleString()} IQD (${salary > 0 ? Math.round(total / salary * 100) : 0}% of salary)
REMAINING: ${remaining.toLocaleString()} IQD
EXPENSE COUNT: ${count} transactions
DAILY AVERAGE: ${dailyAvg.toLocaleString()} IQD/day
DAYS TRACKED: ${daysPassed} of ${daysInMonth}

SPENDING BY PERIOD:
- Early month (days 1-10): ${earlySpend.toLocaleString()} IQD (${total > 0 ? Math.round(earlySpend / total * 100) : 0}%)
- Mid month (days 11-20): ${midSpend.toLocaleString()} IQD (${total > 0 ? Math.round(midSpend / total * 100) : 0}%)
- Late month (days 21-31): ${lateSpend.toLocaleString()} IQD (${total > 0 ? Math.round(lateSpend / total * 100) : 0}%)
${peakDay ? `- Peak spending day: Day ${peakDay[0]} with ${parseInt(peakDay[1]).toLocaleString()} IQD` : ''}

TOP SPENDING CATEGORIES:
${sortedCats.slice(0, 6).map(([cat, amt]) => `- ${cat}: ${amt.toLocaleString()} IQD (${total > 0 ? Math.round(amt / total * 100) : 0}%)`).join('\n')}

${maxExp ? `LARGEST EXPENSE: ${maxExp.title || 'غير معروف'} — ${(maxExp.amount || 0).toLocaleString()} IQD (${maxExp.category || 'أخرى'}) on ${maxExp.date || 'غير محدد'}` : ''}
${minExp && count > 1 ? `SMALLEST EXPENSE: ${minExp.title || 'غير معروف'} — ${(minExp.amount || 0).toLocaleString()} IQD` : ''}
${recurring.length > 0 ? `RECURRING EXPENSES: ${recurring.map(([t, c]) => `${t} (${c} times)`).join(', ')}` : ''}
${prevMonthInfo}

BUDGET RULE ANALYSIS (50/30/20 target):
- Target needs (50%): ${Math.round(salary * 0.5).toLocaleString()} IQD
- Target wants (30%): ${Math.round(salary * 0.3).toLocaleString()} IQD  
- Target savings (20%): ${Math.round(salary * 0.2).toLocaleString()} IQD
- Actual remaining (savings): ${remaining.toLocaleString()} IQD (${salary > 0 ? Math.round(remaining / salary * 100) : 0}%)`;
  }

  /**
   * بناء البرومبت للتحليل المقارن — كل الأشهر
   */
  _buildComparisonPrompt(allMonths) {
    const sorted = allMonths.slice().sort((a, b) => a.year - b.year || a.month - b.month);

    const monthSummaries = sorted.map(m => {
      const expenses = Array.isArray(m.expenses) ? m.expenses : [];
      const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
      const salary = m.salary || 0;
      const remaining = salary - total;
      const catTotals = {};
      expenses.forEach(e => {
        const cat = e.category || 'أخرى';
        catTotals[cat] = (catTotals[cat] || 0) + (e.amount || 0);
      });
      const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

      // توزيع حسب الفترة
      let earlySpend = 0, lateSpend = 0;
      expenses.forEach(e => {
        const day = e.date ? parseInt(e.date.split('-')[2]) : 15;
        if (day <= 10) earlySpend += (e.amount || 0);
        else if (day >= 21) lateSpend += (e.amount || 0);
      });

      return `${m.name} ${m.year}: spent=${total.toLocaleString()}, salary=${salary.toLocaleString()}, remaining=${remaining.toLocaleString()}, rate=${salary > 0 ? Math.round(total / salary * 100) : 0}%, count=${expenses.length}, topCat=${topCat ? `${topCat[0]}(${topCat[1].toLocaleString()})` : 'N/A'}, earlySpend=${Math.round(total > 0 ? earlySpend / total * 100 : 0)}%, lateSpend=${Math.round(total > 0 ? lateSpend / total * 100 : 0)}%`;
    });

    // حساب الاتجاه العام
    const totals = sorted.map(m => (m.expenses || []).reduce((s, e) => s + (e.amount || 0), 0));
    const avgFirst = totals.slice(0, Math.ceil(totals.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(totals.length / 2) || 0;
    const avgLast = totals.slice(Math.floor(totals.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(totals.length / 2) || 0;
    const trendPct = avgFirst > 0 ? Math.round((avgLast - avgFirst) / avgFirst * 100) : 0;

    // تجميع التصنيفات عبر الأشهر
    const allCatMonthly = {};
    sorted.forEach(m => {
      (m.expenses || []).forEach(e => {
        const cat = e.category || 'أخرى';
        if (!allCatMonthly[cat]) allCatMonthly[cat] = [];
        const monthKey = `${m.name} ${m.year}`;
        const existing = allCatMonthly[cat].find(x => x.month === monthKey);
        if (existing) existing.amount += (e.amount || 0);
        else allCatMonthly[cat].push({ month: monthKey, amount: e.amount || 0 });
      });
    });

    const topCatsAcrossMonths = Object.entries(allCatMonthly)
      .map(([cat, monthAmts]) => ({
        cat,
        total: monthAmts.reduce((s, x) => s + x.amount, 0),
        monthsCount: monthAmts.length
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const allTotalExpenses = totals.reduce((a, b) => a + b, 0);
    const allTotalSalaries = sorted.reduce((s, m) => s + (m.salary || 0), 0);

    return `Analyze spending trends across ${sorted.length} months and return JSON only:

OVERALL PERIOD: ${sorted[0]?.name} ${sorted[0]?.year} to ${sorted[sorted.length - 1]?.name} ${sorted[sorted.length - 1]?.year}
TOTAL SPENT ALL TIME: ${allTotalExpenses.toLocaleString()} IQD
TOTAL SALARIES ALL TIME: ${allTotalSalaries.toLocaleString()} IQD
OVERALL SPENDING TREND: ${trendPct > 0 ? '+' : ''}${trendPct}% (first half avg vs second half avg)

MONTHLY BREAKDOWN:
${monthSummaries.join('\n')}

TOP CATEGORIES ACROSS ALL MONTHS:
${topCatsAcrossMonths.map(x => `- ${x.cat}: ${x.total.toLocaleString()} IQD total across ${x.monthsCount} months`).join('\n')}

BEST MONTH (highest remaining): ${sorted.reduce((best, m) => {
      const rem = (m.salary || 0) - (m.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
      const bestRem = (best.salary || 0) - (best.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
      return rem > bestRem ? m : best;
    }, sorted[0])?.name} ${sorted.reduce((best, m) => {
      const rem = (m.salary || 0) - (m.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
      const bestRem = (best.salary || 0) - (best.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
      return rem > bestRem ? m : best;
    }, sorted[0])?.year}

WORST MONTH (highest spending rate): ${sorted.reduce((worst, m) => {
      const rate = m.salary > 0 ? (m.expenses || []).reduce((s, e) => s + (e.amount || 0), 0) / m.salary : 0;
      const worstRate = worst.salary > 0 ? (worst.expenses || []).reduce((s, e) => s + (e.amount || 0), 0) / worst.salary : 0;
      return rate > worstRate ? m : worst;
    }, sorted[0])?.name} ${sorted.reduce((worst, m) => {
      const rate = m.salary > 0 ? (m.expenses || []).reduce((s, e) => s + (e.amount || 0), 0) / m.salary : 0;
      const worstRate = worst.salary > 0 ? (worst.expenses || []).reduce((s, e) => s + (e.amount || 0), 0) / worst.salary : 0;
      return rate > worstRate ? m : worst;
    }, sorted[0])?.year}`;
  }

  /**
   * استدعاء API مع محاولة استخدام النموذج الأساسي ثم الاحتياطي عند الفشل
   */
  async _callAPI(prompt, systemPrompt) {
    try {
      return await this._makeRequest(prompt, systemPrompt, this.primaryModel);
    } catch (error) {
      console.warn(`النموذج الأساسي (${this.primaryModel}) فشل، جاري المحاولة باستخدام النموذج الاحتياطي (${this.backupModel})...`, error);
      try {
        return await this._makeRequest(prompt, systemPrompt, this.backupModel);
      } catch (backupError) {
        console.error('AIFinancialAnalyzer Error: فشل كل من النموذج الأساسي والنموذج الاحتياطي.', backupError);
        throw backupError;
      }
    }
  }

  /**
   * تنفيذ طلب الـ API الفعلي للنموذج المحدد
   */
  async _makeRequest(prompt, systemPrompt, modelName) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      _body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
          { role: "system", content: "أنت خبير ومختص في التحليل المالي وجنسيتك هي عراقي..." },
          { role: "user", content: "بما انك مختص وخبير , حلل هذه البيانات: ..." }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      }),
      get body() {
        return this._body;
      },
      set body(value) {
        this._body = value;
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const rawText = data.choices?.[0]?.message?.content || '';

    // تنظيف أي markdown fences إذا الموديل أضافها رغم التعليمات
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    return JSON.parse(cleaned);
  }
}

window.AIFinancialAnalyzer = AIFinancialAnalyzer;
