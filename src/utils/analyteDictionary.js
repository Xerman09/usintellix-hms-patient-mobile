/**
 * Plain-Language Medical Dictionary & Range Parsing Utilities
 * Provides patient-friendly explanations and reference range mapping for Phase M2.
 */

export const FALLBACK_EXPLANATIONS = {
  hemoglobin: {
    what_it_measures: 'Hemoglobin is an iron-rich protein in red blood cells that transports life-sustaining oxygen from your lungs to the rest of your body.',
    why_ordered: 'Ordered as part of a Complete Blood Count (CBC) to screen for anemia, fatigue, nutritional health, or response to treatments.',
    high_means: 'May occur in chronic dehydration, high altitudes, smoking, lung disease, or polycythemia.',
    low_means: 'Indicates anemia, which can cause tiredness and shortness of breath due to blood loss, iron deficiency, or chronic conditions.',
    source: 'Clinical Reference Library'
  },
  hematocrit: {
    what_it_measures: 'The percentage of your total blood volume that consists of oxygen-carrying red blood cells.',
    why_ordered: 'Evaluates red blood cell concentration alongside hemoglobin to check for dehydration, anemia, or overproduction of blood cells.',
    high_means: 'Often points to dehydration, sleep apnea, smoking, or excess red blood cell production.',
    low_means: 'Suggests anemia, fluid overload, nutritional deficiencies, or internal bleeding.',
    source: 'Clinical Reference Library'
  },
  wbc: {
    what_it_measures: 'White blood cells are the core soldiers of your immune system, defending your body against viruses, bacteria, and foreign invaders.',
    why_ordered: 'Screens for active infections, systemic inflammation, allergies, bone marrow function, or immune reactions.',
    high_means: 'Commonly elevated during bacterial or viral infections, physical stress, tissue injury, or inflammation.',
    low_means: 'May increase susceptibility to infections; can result from viral illnesses, medications, autoimmune conditions, or bone marrow disorders.',
    source: 'Clinical Reference Library'
  },
  'white blood cell': {
    what_it_measures: 'White blood cells are the core soldiers of your immune system, defending your body against viruses, bacteria, and foreign invaders.',
    why_ordered: 'Screens for active infections, systemic inflammation, allergies, bone marrow function, or immune reactions.',
    high_means: 'Commonly elevated during bacterial or viral infections, physical stress, tissue injury, or inflammation.',
    low_means: 'May increase susceptibility to infections; can result from viral illnesses, medications, autoimmune conditions, or bone marrow disorders.',
    source: 'Clinical Reference Library'
  },
  rbc: {
    what_it_measures: 'The actual count of circulating red blood cells carrying oxygen from lungs to muscles and organs.',
    why_ordered: 'Part of standard wellness screening to detect anemia or erythrocytosis.',
    high_means: 'Can result from low oxygen levels (sleep apnea, smoking, high altitude) or dehydration.',
    low_means: 'Points to anemia, chronic kidney disease, nutritional deficits, or blood loss.',
    source: 'Clinical Reference Library'
  },
  'red blood cell': {
    what_it_measures: 'The actual count of circulating red blood cells carrying oxygen from lungs to muscles and organs.',
    why_ordered: 'Part of standard wellness screening to detect anemia or erythrocytosis.',
    high_means: 'Can result from low oxygen levels (sleep apnea, smoking, high altitude) or dehydration.',
    low_means: 'Points to anemia, chronic kidney disease, nutritional deficits, or blood loss.',
    source: 'Clinical Reference Library'
  },
  platelet: {
    what_it_measures: 'Platelets are tiny disk-shaped blood cell fragments essential for forming blood clots and stopping bleeding.',
    why_ordered: 'Evaluates bleeding tendencies, bruising, clotting disorders, or monitors chemotherapy/medication side effects.',
    high_means: 'Can follow acute infection, inflammation, iron deficiency, or bone marrow overactivity.',
    low_means: 'Higher risk of easy bruising or bleeding; can stem from viral infections, medications, liver disease, or immune destruction.',
    source: 'Clinical Reference Library'
  },
  glucose: {
    what_it_measures: 'The concentration of sugar (glucose) dissolved in your bloodstream, your body’s primary fuel source.',
    why_ordered: 'Screens for and monitors prediabetes, diabetes, insulin resistance, or metabolic fluctuations.',
    high_means: 'Suggests elevated blood sugar (hyperglycemia), diabetes, acute illness, stress, or steroid medication use.',
    low_means: 'Hypoglycemia, which can cause dizziness, sweating, or shakiness, commonly from fasting or diabetes medications.',
    source: 'American Diabetes Association / Clinical Guidelines'
  },
  'fasting blood sugar': {
    what_it_measures: 'The baseline amount of glucose present in your blood after going without food for at least 8 hours.',
    why_ordered: 'Primary screening test for diabetes and prediabetes.',
    high_means: 'Levels 100-125 mg/dL suggest prediabetes; 126 mg/dL or higher on repeat tests indicates diabetes.',
    low_means: 'Rare in non-diabetics; may reflect prolonged fasting or medication effects.',
    source: 'Clinical Reference Library'
  },
  hba1c: {
    what_it_measures: 'Measures the percentage of your hemoglobin coated with sugar, giving a clear window into your 3-month average blood glucose.',
    why_ordered: 'Gold standard test for diagnosing and managing diabetes over time.',
    high_means: 'Indicates sustained high blood sugar over recent months, increasing long-term cardiovascular and kidney risks.',
    low_means: 'Generally desirable, but very low numbers with diabetes medications can mean frequent hypoglycemia.',
    source: 'Clinical Reference Library'
  },
  creatinine: {
    what_it_measures: 'A natural waste product produced by normal muscle wear and tear that healthy kidneys continuously filter out in urine.',
    why_ordered: 'The primary blood test used to assess kidney filtration function and monitor kidney-cleared medications.',
    high_means: 'May indicate reduced kidney filtration, severe dehydration, heavy exercise, or high dietary protein intake.',
    low_means: 'Usually reflects low muscle mass or reduced protein intake and is typically not harmful.',
    source: 'National Kidney Foundation'
  },
  bun: {
    what_it_measures: 'Blood Urea Nitrogen measures the amount of nitrogen waste in your blood that comes from protein breakdown.',
    why_ordered: 'Evaluates kidney health, dehydration status, and liver metabolic balance.',
    high_means: 'Often caused by dehydration, high-protein diets, heart failure, or impaired kidney function.',
    low_means: 'Can occur with low-protein diets, high fluid intake, malnutrition, or severe liver disease.',
    source: 'Clinical Reference Library'
  },
  'blood urea nitrogen': {
    what_it_measures: 'Blood Urea Nitrogen measures the amount of nitrogen waste in your blood that comes from protein breakdown.',
    why_ordered: 'Evaluates kidney health, dehydration status, and liver metabolic balance.',
    high_means: 'Often caused by dehydration, high-protein diets, heart failure, or impaired kidney function.',
    low_means: 'Can occur with low-protein diets, high fluid intake, malnutrition, or severe liver disease.',
    source: 'Clinical Reference Library'
  },
  potassium: {
    what_it_measures: 'A vital mineral and electrolyte that enables nerves to fire and muscles—especially your heart muscle—to beat properly.',
    why_ordered: 'Checked regularly during wellness exams, blood pressure therapy, diuretic medication use, or kidney monitoring.',
    high_means: 'Hyperkalemia can disrupt heart rhythm; may be caused by kidney disease, certain blood pressure drugs, or severe dehydration.',
    low_means: 'Hypokalemia can cause muscle weakness, cramps, and palpitations; often caused by diuretics, vomiting, or diarrhea.',
    source: 'Clinical Reference Library'
  },
  sodium: {
    what_it_measures: 'The primary electrolyte in fluid outside your cells, controlling overall water balance, blood volume, and blood pressure.',
    why_ordered: 'Assesses hydration, electrolyte balance, and fluid-regulating hormone systems.',
    high_means: 'Hypernatremia usually means insufficient water intake or dehydration.',
    low_means: 'Hyponatremia is very common; caused by excess fluid intake, heart failure, liver problems, or diuretic medications.',
    source: 'Clinical Reference Library'
  },
  cholesterol: {
    what_it_measures: 'A waxy, fat-like substance found in all your cells that your liver produces to build cell membranes and hormones.',
    why_ordered: 'Assesses cardiovascular risk, plaque buildup, and guides heart health lifestyle and medication plans.',
    high_means: 'Elevated levels can lead to plaque narrowing arteries (atherosclerosis), raising heart disease and stroke risk.',
    low_means: 'Very low levels are uncommon and rarely a concern; can reflect severe malnutrition or liver conditions.',
    source: 'AHA / ACC Lipid Guidelines'
  },
  ldl: {
    what_it_measures: 'Low-Density Lipoprotein, often called "bad" cholesterol because excess amounts deposit into arterial walls as plaque.',
    why_ordered: 'The key target for reducing cardiovascular risk and determining statin therapy.',
    high_means: 'Increases the likelihood of arterial blockage, heart attack, and cardiovascular disease.',
    low_means: 'Lower is generally healthier for preventing cardiovascular plaque buildup.',
    source: 'Clinical Reference Library'
  },
  hdl: {
    what_it_measures: 'High-Density Lipoprotein, known as "good" cholesterol because it absorbs extra cholesterol and carries it back to the liver.',
    why_ordered: 'Protective marker evaluated in lipid panels.',
    high_means: 'Higher numbers (above 50-60 mg/dL) are protective against heart disease.',
    low_means: 'Increases cardiovascular disease risk; often improved with regular aerobic exercise and healthy fats.',
    source: 'Clinical Reference Library'
  },
  triglycerides: {
    what_it_measures: 'The most common type of fat in your body, storing unused calories from meals to provide energy between meals.',
    why_ordered: 'Monitors cardiovascular risk, metabolic health, and pancreas inflammation risk.',
    high_means: 'Associated with insulin resistance, excess carbohydrates/alcohol, overweight, and cardiovascular risk.',
    low_means: 'Rarely a clinical concern; associated with low-fat diets or hyperthyroidism.',
    source: 'Clinical Reference Library'
  },
  alt: {
    what_it_measures: 'Alanine Aminotransferase is an enzyme found mostly inside liver cells that helps turn food into energy.',
    why_ordered: 'A sensitive screening marker for liver inflammation, injury, or medication side effects.',
    high_means: 'Suggests liver cell irritation or injury from fatty liver, viral hepatitis, alcohol, or medications.',
    low_means: 'Completely normal and indicates absence of active liver cell leakage.',
    source: 'American College of Gastroenterology'
  },
  ast: {
    what_it_measures: 'Aspartate Aminotransferase is an enzyme found in liver cells, heart muscle, and skeletal muscles.',
    why_ordered: 'Evaluates liver and muscle health alongside ALT.',
    high_means: 'Elevated during liver injury, heavy muscle exertion, heart strain, or alcohol intake.',
    low_means: 'Normal and healthy.',
    source: 'Clinical Reference Library'
  },
  tsh: {
    what_it_measures: 'Thyroid Stimulating Hormone is produced by your pituitary gland to tell your thyroid how much hormone to produce.',
    why_ordered: 'First-line test to check for overactive (hyperthyroid) or underactive (hypothyroid) thyroid gland.',
    high_means: 'Typically indicates an underactive thyroid (hypothyroidism); your body is sending more TSH to boost thyroid output.',
    low_means: 'Indicates an overactive thyroid (hyperthyroidism); excess thyroid hormone suppresses TSH production.',
    source: 'American Thyroid Association'
  }
};

/**
 * Resolves an explanation for an analyte by checking the server-provided dictionary first,
 * then falling back to the built-in clinical library.
 */
export function getAnalyteExplanation(name, code, orderExplanations = {}) {
  const normName = String(name || '').trim();
  const lowerName = normName.toLowerCase();
  const lowerCode = String(code || '').trim().toLowerCase();

  // 1. Check server-provided explanations
  if (orderExplanations && typeof orderExplanations === 'object') {
    if (orderExplanations[normName]) return orderExplanations[normName];
    if (orderExplanations[lowerName]) return orderExplanations[lowerName];
    if (lowerCode && orderExplanations[lowerCode]) return orderExplanations[lowerCode];

    // Case-insensitive sweep
    for (const [k, v] of Object.entries(orderExplanations)) {
      if (k.toLowerCase() === lowerName || (lowerCode && k.toLowerCase() === lowerCode)) {
        return v;
      }
    }
  }

  // 2. Check fallback dictionary
  for (const [key, explanation] of Object.entries(FALLBACK_EXPLANATIONS)) {
    if (lowerName === key || lowerCode === key || lowerName.includes(key)) {
      return explanation;
    }
  }

  return null;
}

/**
 * Parses numeric value and reference ranges to compute position on visual range bar.
 */
export function parseRangeAndValue(valueStr, rangeStr) {
  if (valueStr === null || valueStr === undefined) {
    return { hasRange: false, value: null, low: null, high: null, percent: 50, status: 'unknown' };
  }

  // Extract first floating point number
  const vMatch = String(valueStr).match(/[-+]?[0-9]*\.?[0-9]+/);
  if (!vMatch) {
    return { hasRange: false, value: null, low: null, high: null, percent: 50, status: 'unknown' };
  }
  const value = parseFloat(vMatch[0]);

  if (!rangeStr) {
    return { hasRange: false, value, low: null, high: null, percent: 50, status: 'unknown' };
  }

  // Parse "12.0 - 17.5" or "12.0-17.5"
  const rangeMatch = String(rangeStr).match(/([0-9]*\.?[0-9]+)\s*[-–—to]+\s*([0-9]*\.?[0-9]+)/i);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    if (!isNaN(low) && !isNaN(high) && high > low) {
      // Calculate buffer (20% on each side)
      const span = high - low;
      const minPlot = Math.max(0, low - span * 0.25);
      const maxPlot = high + span * 0.25;
      const totalSpan = maxPlot - minPlot;

      let pct = ((value - minPlot) / totalSpan) * 100;
      pct = Math.max(4, Math.min(96, pct));

      let status = 'normal';
      if (value < low) status = 'low';
      else if (value > high) status = 'high';

      return {
        hasRange: true,
        value,
        low,
        high,
        percent: pct,
        status
      };
    }
  }

  // Parse "< 200" or "<= 200"
  const ltMatch = String(rangeStr).match(/(?:<|<=|less than)\s*([0-9]*\.?[0-9]+)/i);
  if (ltMatch) {
    const high = parseFloat(ltMatch[1]);
    const low = 0;
    const maxPlot = high * 1.3;
    let pct = (value / maxPlot) * 100;
    pct = Math.max(4, Math.min(96, pct));
    const status = value > high ? 'high' : 'normal';
    return { hasRange: true, value, low, high, percent: pct, status };
  }

  // Parse "> 60"
  const gtMatch = String(rangeStr).match(/(?:>|>=|greater than)\s*([0-9]*\.?[0-9]+)/i);
  if (gtMatch) {
    const low = parseFloat(gtMatch[1]);
    const high = low * 1.8;
    let pct = ((value - low * 0.5) / (high - low * 0.5)) * 100;
    pct = Math.max(4, Math.min(96, pct));
    const status = value < low ? 'low' : 'normal';
    return { hasRange: true, value, low, high: null, percent: pct, status };
  }

  return { hasRange: false, value, low: null, high: null, percent: 50, status: 'unknown' };
}
