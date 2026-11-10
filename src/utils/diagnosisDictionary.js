/**
 * A small offline fallback for diagnosis guides.
 *
 * WHEN THIS MAY BE USED, and only this:
 *   the request for guides FAILED (no network, server unreachable).
 *
 * It must never be used when the server answered and simply had no guide for a
 * diagnosis. That answer is a decision: an admin may have deliberately switched a
 * guide off, or reworded it, or there may be no guide because nobody has written one
 * that a clinician approved. Substituting hard-coded wording in that case would show
 * a patient something the hospital chose not to show them, and would quietly
 * contradict an edit made in the Diagnosis Guides screen.
 *
 * Kept deliberately short -- a handful of the commonest conditions, so that a
 * patient on a bad connection still sees something useful. The hospital's own rows
 * always win. See portal_diagnosis_guides (schema 333) for the real content.
 */

const FALLBACK_GUIDES = [
  {
    keywords: ['hypertension', 'high blood pressure', 'htn', 'high bp'],
    title: 'High blood pressure',
    about:
      'Blood pressure is the force of blood pushing against the walls of your arteries. When it stays higher than it should over months and years, the heart has to work harder and the arteries slowly stiffen.',
    dos: [
      'Take the medicines you were prescribed every day, even on days you feel completely well.',
      'Have your blood pressure measured regularly and write the readings down.',
      'Cut down on salt, and keep to about 30 minutes of walking most days.'
    ],
    donts: [
      'Do not stop or skip your medicine because your reading has become normal.',
      'Do not change your own dose, and do not take someone else’s medicine.',
      'Avoid smoking, and keep alcohol low.'
    ],
    when_to_seek_help: [
      'Chest pain or tightness, or pain spreading to the arm, neck or jaw.',
      'Sudden weakness or numbness on one side, drooping face, or trouble speaking.',
      'A reading of 180/120 or higher, especially with any of the above.'
    ]
  },
  {
    keywords: ['diabetes', 'diabetes mellitus', 'type 2 diabetes', 'dm type 2', 't2dm'],
    title: 'Type 2 diabetes',
    about:
      'The sugar in your blood is higher than it should be, because the body no longer responds properly to insulin — the hormone that moves sugar out of the blood and into the cells.',
    dos: [
      'Take your medicine or insulin exactly as prescribed, at the right time relative to meals.',
      'Check your blood sugar as often as you were asked, and write the numbers down.',
      'Look at your feet every day — top, sole and between the toes.'
    ],
    donts: [
      'Do not stop your medicine because your sugar readings have improved.',
      'Do not skip meals while taking diabetes medicine.',
      'Do not walk barefoot, and do not treat a foot wound at home.'
    ],
    when_to_seek_help: [
      'Shakiness, sweating or confusion that does not improve after taking something sweet.',
      'Vomiting with deep fast breathing, or a fruity smell on the breath.',
      'Any foot wound, blister, redness or blackened skin — the same day.'
    ]
  },
  {
    keywords: ['asthma', 'bronchial asthma'],
    title: 'Asthma',
    about:
      'The airways are sensitive and easily inflamed. When something sets them off they tighten, swell and fill with mucus, which narrows them and makes breathing out hard.',
    dos: [
      'Use your controller inhaler every day as prescribed, even when you feel well.',
      'Carry your reliever inhaler with you at all times.',
      'Reduce dust at home and wash bedding weekly in hot water.'
    ],
    donts: [
      'Do not rely on the reliever inhaler alone.',
      'Do not stop the controller inhaler because you feel fine.',
      'Do not smoke or vape, and keep smoke out of the house.'
    ],
    when_to_seek_help: [
      'Breathlessness so bad you cannot speak a full sentence, walk, or lie flat.',
      'The reliever inhaler not working, or wearing off in under two to three hours.',
      'Lips or fingertips turning bluish.'
    ]
  },
  {
    keywords: ['dengue', 'dengue fever'],
    title: 'Dengue',
    about:
      'A viral infection carried by mosquitoes. There is a critical window just as the fever drops, usually day three to seven, when the illness can become dangerous — which is why follow-up during that window matters.',
    dos: [
      'Drink plenty of fluids: water, oral rehydration solution, soups.',
      'Take paracetamol only, for fever and pain, exactly as directed.',
      'Watch most carefully in the day or two after the fever drops.'
    ],
    donts: [
      'Do not take aspirin, mefenamic acid or ibuprofen — they increase the risk of bleeding.',
      'Do not assume you are safe once the fever goes.',
      'Do not stay home and wait if any warning sign appears.'
    ],
    when_to_seek_help: [
      'Severe belly pain, or persistent vomiting.',
      'Bleeding gums, nosebleeds, bruising, or black stool.',
      'Restlessness, drowsiness, or cold clammy hands and feet.'
    ]
  },
  {
    keywords: ['uti', 'urinary tract infection', 'cystitis'],
    title: 'Urinary tract infection',
    about:
      'An infection in the urinary system, most often the bladder, where bacteria that normally live in the bowel get in and multiply in urine.',
    dos: [
      'Finish the whole course of antibiotics, even once the burning has stopped.',
      'Drink plenty of water through the day.',
      'Pass urine when you feel the need rather than holding it.'
    ],
    donts: [
      'Do not stop the antibiotic early.',
      'Do not use leftover antibiotics or someone else’s.',
      'Do not hold urine for long periods.'
    ],
    when_to_seek_help: [
      'Fever with chills, or pain in the back or side below the ribs.',
      'Vomiting, or being unable to keep fluids or medicine down.',
      'Symptoms not improving after two to three days of antibiotics.'
    ]
  },
  {
    keywords: ['tuberculosis', 'ptb', 'pulmonary tuberculosis', 'koch'],
    title: 'Pulmonary tuberculosis',
    about:
      'An infection of the lungs by the TB bacterium. It is curable, but only with a full course of several medicines taken for months.',
    dos: [
      'Take every single dose for the whole number of months prescribed.',
      'Keep to your treatment supporter or DOTS schedule and every sputum check.',
      'Cover your mouth when coughing, and keep windows open.'
    ],
    donts: [
      'Do not stop treatment when you start to feel better — that is what creates drug-resistant TB.',
      'Do not miss doses or take them irregularly.',
      'Do not smoke or drink alcohol during treatment.'
    ],
    when_to_seek_help: [
      'Coughing up a large amount of blood.',
      'Yellowing of the eyes or skin, dark urine, or persistent vomiting.',
      'A new rash, fever or severe itching after starting treatment.'
    ]
  },
  {
    keywords: ['pneumonia', 'lung infection'],
    title: 'Pneumonia',
    about:
      'An infection in the lung tissue itself. The small air sacs fill with fluid and pus, so that part of the lung cannot take up oxygen properly.',
    dos: [
      'Finish the whole course of antibiotics, even after you feel better.',
      'Rest, and drink plenty of fluids to loosen the phlegm.',
      'Sit up and take slow deep breaths several times an hour.'
    ],
    donts: [
      'Do not stop the antibiotic early because the fever has gone.',
      'Do not smoke, and stay away from smoke while the lung heals.',
      'Do not go back to heavy work while still breathless.'
    ],
    when_to_seek_help: [
      'Breathlessness at rest, breathing fast, or bluish lips.',
      'Fever still there after three days of antibiotics, or returning.',
      'Coughing up blood, or chest pain that is getting worse.'
    ]
  },
  {
    keywords: ['gastroenteritis', 'diarrhea', 'diarrhoea', 'loose bowel movement', 'lbm'],
    title: 'Acute gastroenteritis',
    about:
      'An infection of the stomach and bowel causing diarrhoea and vomiting. Most of it settles by itself; what actually matters is replacing the fluid you are losing.',
    dos: [
      'Drink oral rehydration solution in small frequent sips.',
      'Keep eating as soon as you can manage it: rice, banana, bread, soup.',
      'Wash hands with soap after the toilet and before preparing food.'
    ],
    donts: [
      'Do not take medicine to stop the diarrhoea unless your doctor told you to.',
      'Do not use softdrinks or undiluted juice to rehydrate.',
      'Do not prepare food for other people while you are ill.'
    ],
    when_to_seek_help: [
      'Very little or no urine, dry mouth, sunken eyes, or drowsiness.',
      'Blood or mucus in the stool, or black stool.',
      'Vomiting everything, so nothing stays down for hours.'
    ]
  }
];

/** Text reduced to space-separated words, padded, so matching is on whole words. */
const matchable = (text) => ` ${String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;

/**
 * The fallback guide for a diagnosis, or null.
 *
 * Call this ONLY after a failed request (see the note at the top of this file).
 * Longest keyword wins, the same rule the server uses.
 */
export function getFallbackDiagnosisGuide(diagnosisText) {
  const haystack = matchable(diagnosisText);
  if (haystack.trim() === '') return null;

  let best = null;
  let bestLen = 0;

  for (const guide of FALLBACK_GUIDES) {
    for (const kw of [guide.title, ...guide.keywords]) {
      const padded = matchable(kw);
      if (padded.length > bestLen && haystack.indexOf(padded) !== -1) {
        best = guide;
        bestLen = padded.length;
      }
    }
  }

  if (!best) return null;

  return {
    title: best.title,
    about: best.about,
    why_it_happens: null,
    common_symptoms: null,
    dos: best.dos,
    donts: best.donts,
    when_to_seek_help: best.when_to_seek_help,
    source: 'Offline reference — shown because the hospital’s own guide could not be loaded'
  };
}

/** Guides for a list of diagnoses, keyed by their text, as the server would return them. */
export function getFallbackGuides(items) {
  const out = {};

  for (const item of items || []) {
    const text = item?.text || '';
    const guide = getFallbackDiagnosisGuide(text);
    if (guide) out[text] = guide;
  }

  return out;
}
