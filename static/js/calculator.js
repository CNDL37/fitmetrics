let units = 'imperial';
let weightChart = null;

function setUnits(u) {
  units = u;
  document.getElementById('btn-imperial').classList.toggle('active', u === 'imperial');
  document.getElementById('btn-metric').classList.toggle('active', u === 'metric');
  document.getElementById('height-imperial').style.display = u === 'imperial' ? '' : 'none';
  document.getElementById('height-metric').style.display = u === 'metric' ? '' : 'none';
  document.getElementById('weight-label').textContent = u === 'imperial' ? 'Weight (lbs)' : 'Weight (kg)';
  const optSpan = ' <span style="font-weight:400;color:var(--muted);">\u2014 optional</span>';
  const optBFSpan = ' <span style="font-weight:400;color:var(--muted);">\u2014 optional, for body fat %</span>';
  document.getElementById('waist-label').innerHTML = (u === 'imperial' ? 'Waist Circumference (inches)' : 'Waist Circumference (cm)') + optSpan;
  document.getElementById('neck-label').innerHTML  = (u === 'imperial' ? 'Neck Circumference (inches)'  : 'Neck Circumference (cm)')  + optBFSpan;
  document.getElementById('hip-label').innerHTML   = (u === 'imperial' ? 'Hip Circumference (inches)'   : 'Hip Circumference (cm)')   + optBFSpan;
}

function getInputs() {
  const age = parseFloat(document.getElementById('age').value);
  const sex = document.getElementById('sex').value;
  const weightRaw = parseFloat(document.getElementById('weight').value);
  const waistRaw = parseFloat(document.getElementById('waist').value);
  const neckRaw  = parseFloat(document.getElementById('neck').value);
  const hipRaw   = parseFloat(document.getElementById('hip').value);

  let weightKg, heightCm, waistCm, neckCm, hipCm;

  if (units === 'imperial') {
    weightKg = weightRaw * 0.453592;
    const ft = parseFloat(document.getElementById('height-ft').value) || 0;
    const inch = parseFloat(document.getElementById('height-in').value) || 0;
    heightCm = (ft * 12 + inch) * 2.54;
    waistCm = waistRaw ? waistRaw * 2.54 : null;
    neckCm  = neckRaw  ? neckRaw  * 2.54 : null;
    hipCm   = hipRaw   ? hipRaw   * 2.54 : null;
  } else {
    weightKg = weightRaw;
    heightCm = parseFloat(document.getElementById('height-cm').value);
    waistCm  = waistRaw  || null;
    neckCm   = neckRaw   || null;
    hipCm    = hipRaw    || null;
  }

  const activityLevel = document.querySelector('input[name="activity"]:checked')?.value || 'sedentary';
  const diet = document.querySelector('input[name="diet"]:checked')?.value || 'balanced';

  return { age, sex, weightKg, heightCm, waistCm, neckCm, hipCm, activityLevel, diet };
}

function validate(d) {
  if (!d.age || d.age < 15 || d.age > 110) return 'Please enter a valid age (15\u2013110).';
  if (!d.sex) return 'Please select a biological sex.';
  if (!d.weightKg || d.weightKg < 20) return 'Please enter a valid weight.';
  if (!d.heightCm || d.heightCm < 100) return 'Please enter a valid height.';
  if (d.waistCm !== null && d.waistCm < 30) return 'Waist circumference seems too small \u2014 please check the value.';
  return null;
}

function calcBMI(weightKg, heightCm) {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: '#60a5fa' };
  if (bmi < 25)   return { label: 'Normal Weight', color: '#34d399' };
  if (bmi < 30)   return { label: 'Overweight', color: '#fbbf24' };
  if (bmi < 35)   return { label: 'Obese Class I', color: '#f87171' };
  if (bmi < 40)   return { label: 'Obese Class II', color: '#ef4444' };
  return { label: 'Obese Class III', color: '#dc2626' };
}

// Mifflin-St Jeor
function calcBMR(weightKg, heightCm, age, sex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

// US Navy body fat method (measurements in cm, converted to inches internally)
function calcNavyBF(heightCm, waistCm, neckCm, hipCm, sex) {
  const toIn = (cm) => cm / 2.54;
  const h = toIn(heightCm);
  const w = toIn(waistCm);
  const n = toIn(neckCm);
  let pct;
  if (sex === 'male') {
    pct = 86.010 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
  } else {
    const hip = toIn(hipCm);
    pct = 163.205 * Math.log10(w + hip - n) - 97.684 * Math.log10(h) - 78.387;
  }
  return Math.max(0, +pct.toFixed(1));
}

function bfCategory(pct, sex) {
  if (sex === 'male') {
    if (pct < 6)  return { label: 'Essential Fat', color: '#60a5fa' };
    if (pct < 14) return { label: 'Athletic',      color: '#34d399' };
    if (pct < 18) return { label: 'Fitness',       color: '#4f8ef7' };
    if (pct < 25) return { label: 'Average',       color: '#fbbf24' };
    return              { label: 'High',           color: '#f87171' };
  } else {
    if (pct < 14) return { label: 'Essential Fat', color: '#60a5fa' };
    if (pct < 21) return { label: 'Athletic',      color: '#34d399' };
    if (pct < 25) return { label: 'Fitness',       color: '#4f8ef7' };
    if (pct < 32) return { label: 'Average',       color: '#fbbf24' };
    return              { label: 'High',           color: '#f87171' };
  }
}

function cvRisk(whr) {
  if (whr < 0.40) return { label: 'Low', cls: 'low', note: 'Waist-to-height ratio is in the low-risk range.' };
  if (whr <= 0.50) return { label: 'Healthy / Moderate', cls: 'moderate', note: 'Your ratio is within the healthy range. Maintain current habits.' };
  if (whr <= 0.60) return { label: 'High', cls: 'high', note: 'Elevated central adiposity. Consider reducing visceral fat through diet and aerobic activity.' };
  return { label: 'Very High', cls: 'very-high', note: 'Significantly elevated cardiovascular risk. Consultation with a healthcare provider is recommended.' };
}

function proteinTiers(weightKg, activityLevel, age) {
  const older     = age >= 60;
  const minG      = Math.round(1.0 * weightKg);
  const olderG    = Math.round(1.4 * weightKg);
  const moderateG = Math.round(1.2 * weightKg);
  const activeG   = Math.round(1.6 * weightKg);
  const athleteG  = Math.round(2.0 * weightKg);

  const tiers = [
    { label: `Baseline (1.0g/kg${older ? ' \u2014 elevated for age 60+' : ''})`, value: `${minG}g / day` }
  ];
  if (older)
    tiers.push({ label: 'Sarcopenia prevention, age 60+ (1.4g/kg)', value: `${olderG}g / day` });
  if (activityLevel === 'active')
    tiers.push({ label: 'Recreationally active (1.2\u20131.6g/kg)', value: `${moderateG}\u2013${activeG}g / day` });
  if (activityLevel === 'athlete')
    tiers.push({ label: 'Athlete / strength training (1.6\u20132.0g/kg)', value: `${activeG}\u2013${athleteG}g / day` });
  return tiers;
}

const DIET_NOTES = {
  'balanced':      'Standard split \u2014 protein by activity level, ~28% fat, balance as carbohydrates.',
  'low-carb':      'Carbs capped at 50g. Fat fills remaining calories after protein.',
  'very-low-carb': 'Carbs capped at 30g. Fat fills remaining calories after protein.',
  'keto':          '~25g net carbs \u2014 sustains nutritional ketosis. Fat is the primary fuel source.',
  'carnivore':     'Zero carbohydrates. Protein elevated to 2.0g/kg; fat supplies remaining calories.',
};

function macros(bmr, weightKg, activityLevel, diet) {
  let proteinG;
  if (activityLevel === 'athlete')     proteinG = Math.round(1.8 * weightKg);
  else if (activityLevel === 'active') proteinG = Math.round(1.4 * weightKg);
  else                                 proteinG = Math.round(1.0 * weightKg);

  let carbG, fatG;

  if (diet === 'carnivore') {
    proteinG = Math.round(2.0 * weightKg);
    carbG = 0;
    fatG = Math.max(10, Math.round((bmr - proteinG * 4) / 9));
  } else if (diet === 'keto') {
    carbG = 25;
    fatG = Math.max(10, Math.round((bmr - proteinG * 4 - carbG * 4) / 9));
  } else if (diet === 'very-low-carb') {
    carbG = 30;
    fatG = Math.max(10, Math.round((bmr - proteinG * 4 - carbG * 4) / 9));
  } else if (diet === 'low-carb') {
    carbG = 50;
    fatG = Math.max(10, Math.round((bmr - proteinG * 4 - carbG * 4) / 9));
  } else {
    const fatKcal = Math.round(bmr * 0.28);
    fatG  = Math.round(fatKcal / 9);
    carbG = Math.max(0, Math.round((bmr - proteinG * 4 - fatKcal) / 4));
  }

  const totalKcal = proteinG * 4 + fatG * 9 + carbG * 4;
  const pPct = Math.round(proteinG * 4 / totalKcal * 100);
  const fPct = Math.round(fatG * 9 / totalKcal * 100);
  const cPct = 100 - pPct - fPct;
  return { proteinG, fatG, carbG, pPct, fPct, cPct, note: DIET_NOTES[diet] || DIET_NOTES['balanced'] };
}

function calcHeartRates(age, sex) {
  const maxHR = Math.round(sex === 'male' ? 208 - 0.7 * age : 206 - 0.88 * age);
  const formula = sex === 'male'
    ? `Tanaka formula: 208 \u2212 0.7 \u00d7 ${age}`
    : `Gulati formula: 206 \u2212 0.88 \u00d7 ${age}`;

  const zones = [
    { zone: 1, pctLow: 0.50, pctHigh: 0.60, color: '#60a5fa', name: 'Zone 1', desc: 'Recovery / very light' },
    { zone: 2, pctLow: 0.60, pctHigh: 0.70, color: '#34d399', name: 'Zone 2', desc: 'Aerobic base, fat oxidation' },
    { zone: 3, pctLow: 0.70, pctHigh: 0.80, color: '#fbbf24', name: 'Zone 3', desc: 'Aerobic endurance' },
    { zone: 4, pctLow: 0.80, pctHigh: 0.90, color: '#f97316', name: 'Zone 4', desc: 'Lactate threshold' },
    { zone: 5, pctLow: 0.90, pctHigh: 1.00, color: '#f87171', name: 'Zone 5', desc: 'Max effort / VO\u2082 max' },
  ].map(z => ({ ...z, low: Math.round(z.pctLow * maxHR), high: Math.round(z.pctHigh * maxHR) }));

  return { maxHR, formula, zones };
}

function waterMl(weightKg) { return Math.round(35 * weightKg); }

function fiberG(age, sex) {
  if (sex === 'male') {
    return age <= 50 ? { g: 38, note: 'Men \u226450: 38g/day (DRI)' } : { g: 30, note: 'Men >50: 30g/day (DRI)' };
  }
  return age <= 50 ? { g: 25, note: 'Women \u226450: 25g/day (DRI)' } : { g: 21, note: 'Women >50: 21g/day (DRI)' };
}

function stepCalories(steps, weightKg, age) {
  const met = age > 60 ? 3.2 : 3.5;
  const hours = steps / 100 / 60;
  return Math.round(met * weightKg * hours);
}

function simulateWeightLoss(startKg, heightCm, age, sex, deficitKcal, numWeeks) {
  const fixedIntake = calcBMR(startKg, heightCm, age, sex) - deficitKcal;
  const minIntake = sex === 'male' ? 1500 : 1200;
  const clampedIntake = Math.max(fixedIntake, minIntake);
  const weights = [startKg];
  let currentKg = startKg;
  for (let w = 1; w <= numWeeks; w++) {
    const currentBMR = calcBMR(currentKg, heightCm, age, sex);
    const weeklyDeficit = Math.max(0, currentBMR - clampedIntake) * 7;
    const lostKg = weeklyDeficit / 7700;
    currentKg = Math.max(currentKg - lostKg, 18.5 * Math.pow(heightCm / 100, 2));
    weights.push(+currentKg.toFixed(2));
  }
  return weights;
}

function buildWeightChart(weightKg, heightCm, age, sex) {
  const numWeeks = 52;
  const labels = Array.from({ length: numWeeks + 1 }, (_, i) => i === 0 ? 'Start' : `Wk ${i}`);
  const gradualWeights = simulateWeightLoss(weightKg, heightCm, age, sex, 200, numWeeks);
  const steadyWeights  = simulateWeightLoss(weightKg, heightCm, age, sex, 500, numWeeks);
  const minHealthyKg   = 18.5 * Math.pow(heightCm / 100, 2);
  const displayFn = units === 'imperial' ? (kg) => +(kg * 2.20462).toFixed(1) : (kg) => +kg.toFixed(1);
  const unit = units === 'imperial' ? 'lbs' : 'kg';
  const isMobile = window.innerWidth < 600;

  const datasets = [
    { label: 'Gradual Loss (\u2013200 kcal/day)', data: gradualWeights.map(displayFn), borderColor: '#34d399', borderWidth: 2.5, pointRadius: 0, tension: 0.3, fill: false },
    { label: 'Steady Loss (\u2013500 kcal/day)',  data: steadyWeights.map(displayFn),  borderColor: '#f87171', borderWidth: 2.5, pointRadius: 0, tension: 0.3, fill: false },
    { label: 'Healthy Minimum (BMI 18.5)', data: labels.map(() => displayFn(minHealthyKg)), borderColor: '#94a3b8', borderWidth: 1, borderDash: [6,4], pointRadius: 0, tension: 0, fill: false },
  ];

  if (weightChart) weightChart.destroy();
  const ctx = document.getElementById('weight-chart').getContext('2d');
  weightChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: isMobile ? 1.4 : 2.2,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { size: isMobile ? 10 : 12 }, boxWidth: isMobile ? 24 : 40 } },
        tooltip: {
          backgroundColor: '#1a1d27', borderColor: '#2e3350', borderWidth: 1,
          titleColor: '#e2e8f0', bodyColor: '#94a3b8',
          callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} ${unit}` }
        }
      },
      scales: {
        x: { ticks: { color: '#94a3b8', maxTicksLimit: isMobile ? 7 : 14, font: { size: isMobile ? 9 : 11 } }, grid: { color: 'rgba(46,51,80,0.5)' } },
        y: { ticks: { color: '#94a3b8', font: { size: isMobile ? 9 : 11 }, callback: (v) => `${v} ${unit}` }, grid: { color: 'rgba(46,51,80,0.5)' } }
      }
    }
  });
}

function renderMacros(mac) {
  document.getElementById('macro-p-g').textContent = `${mac.proteinG}g (${mac.pPct}%)`;
  document.getElementById('macro-f-g').textContent = `${mac.fatG}g (${mac.fPct}%)`;
  document.getElementById('macro-c-g').textContent = `${mac.carbG}g (${mac.cPct}%)`;
  document.getElementById('bar-p').style.width = mac.pPct + '%';
  document.getElementById('bar-f').style.width = mac.fPct + '%';
  document.getElementById('bar-c').style.width = mac.cPct + '%';
  document.getElementById('diet-note').textContent = mac.note;
}

function calculate() {
  const d = getInputs();
  const err = validate(d);
  if (err) { alert(err); return; }

  const bmi    = calcBMI(d.weightKg, d.heightCm);
  const bmiCat = bmiCategory(bmi);
  const bmr    = calcBMR(d.weightKg, d.heightCm, d.age, d.sex);
  const protein = proteinTiers(d.weightKg, d.activityLevel, d.age);
  const mac     = macros(bmr, d.weightKg, d.activityLevel, d.diet);
  const water   = waterMl(d.weightKg);
  const fiber   = fiberG(d.age, d.sex);
  const hr      = calcHeartRates(d.age, d.sex);

  // Body fat (Navy method)
  const bfCard = document.getElementById('bf-card');
  const canCalcBF = d.waistCm && d.neckCm && (d.sex === 'male' || d.hipCm);
  if (canCalcBF) {
    const bf    = calcNavyBF(d.heightCm, d.waistCm, d.neckCm, d.hipCm, d.sex);
    const bfCat = bfCategory(bf, d.sex);
    bfCard.style.display = '';
    bfCard.style.setProperty('--card-color', bfCat.color);
    document.getElementById('bf-val').textContent = bf.toFixed(1) + '%';
    const bfBadge = document.getElementById('bf-cat');
    bfBadge.textContent = bfCat.label;
    bfBadge.style.color = bfCat.color;
    const leanKg = d.weightKg * (1 - bf / 100);
    document.getElementById('bf-sub').textContent =
      'Lean mass \u2248 ' + (units === 'imperial' ? (leanKg * 2.205).toFixed(1) + ' lbs' : leanKg.toFixed(1) + ' kg');
  } else {
    bfCard.style.display = 'none';
  }

  // Tier 1
  document.getElementById('bmi-val').textContent = bmi.toFixed(1);
  const bmiEl = document.getElementById('bmi-cat');
  bmiEl.textContent = bmiCat.label;
  bmiEl.closest('.result-card').style.setProperty('--card-color', bmiCat.color);
  document.getElementById('bmr-val').textContent = Math.round(bmr).toLocaleString();

  const cvCard = document.getElementById('cv-risk-card');
  if (d.waistCm) {
    const whr = d.waistCm / d.heightCm;
    const cv  = cvRisk(whr);
    cvCard.style.display = '';
    document.getElementById('whr-val').textContent = whr.toFixed(3);
    document.getElementById('cv-badge-wrap').innerHTML = `<span class="cv-risk-badge ${cv.cls}">${cv.label}</span>`;
    document.getElementById('cv-note').textContent = cv.note;
  } else {
    cvCard.style.display = 'none';
  }

  document.getElementById('protein-tiers').innerHTML = protein.map(t =>
    `<div class="protein-tier"><span class="tier-label">${t.label}</span><span class="tier-value">${t.value}</span></div>`
  ).join('');

  // Heart rate
  document.getElementById('hr-max').textContent = hr.maxHR + ' bpm';
  document.getElementById('hr-max-formula').textContent = hr.formula;
  const zone2 = hr.zones[1];
  document.getElementById('hr-zone2').textContent = `${zone2.low} \u2013 ${zone2.high} bpm`;
  document.getElementById('hr-zone-table').innerHTML = hr.zones.map(z =>
    '<div class="hr-block' + (z.zone === 2 ? ' zone2-highlight' : '') + '" style="border-top-color:' + z.color + ';">' +
      '<div class="hr-block-name" style="color:' + z.color + ';">' + z.name + '</div>' +
      '<div class="hr-block-range">' + z.low + '\u2013' + z.high + ' bpm</div>' +
      '<div class="hr-block-pct">' + Math.round(z.pctLow * 100) + '\u2013' + Math.round(z.pctHigh * 100) + '%</div>' +
      '<div class="hr-block-desc">' + z.desc + '</div>' +
    '</div>'
  ).join('');

  // Tier 2
  const minKcal = d.sex === 'male' ? 1500 : 1200;
  const calModerate   = Math.max(minKcal, Math.round(bmr - 200));
  const calAggressive = Math.max(minKcal, Math.round(bmr - 500));
  document.getElementById('cal-moderate').textContent = `${calModerate.toLocaleString()} kcal`;
  document.getElementById('cal-aggressive').textContent = `${calAggressive.toLocaleString()} kcal`;
  document.getElementById('loss-moderate').textContent  = `\u2248 ${((bmr - calModerate) * 7 / 3500).toFixed(1)} lb/week (week 1; tapers over time)`;
  document.getElementById('loss-aggressive').textContent = `\u2248 ${((bmr - calAggressive) * 7 / 3500).toFixed(1)} lb/week (week 1; tapers over time)`;

  renderMacros(mac);

  const waterOz = Math.round(water / 29.574);
  document.getElementById('water-val').textContent = `${(water / 1000).toFixed(1)} L`;
  document.getElementById('water-oz').textContent = `${waterOz} fl oz / day`;
  document.getElementById('fiber-val').textContent = `${fiber.g}g`;
  document.getElementById('fiber-note').textContent = fiber.note;
  document.getElementById('steps-7500').textContent  = `~${stepCalories(7500,  d.weightKg, d.age)} kcal`;
  document.getElementById('steps-10000').textContent = `~${stepCalories(10000, d.weightKg, d.age)} kcal`;

  document.getElementById('results-panel').classList.add('visible');
  document.getElementById('placeholder-panel').style.display = 'none';
  requestAnimationFrame(function() {
    buildWeightChart(d.weightKg, d.heightCm, d.age, d.sex);
    if (window.innerWidth < 800) {
      document.getElementById('results-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

// Show/hide hip circumference field based on sex selection
document.getElementById('sex').addEventListener('change', function() {
  document.getElementById('hip-field').style.display = this.value === 'female' ? '' : 'none';
  if (this.value !== 'female') document.getElementById('hip').value = '';
});

document.addEventListener('keydown', (e) => { if (e.key === 'Enter') calculate(); });

document.querySelectorAll('input[name="diet"]').forEach(radio => {
  radio.addEventListener('change', () => {
    if (!document.getElementById('results-panel').classList.contains('visible')) return;
    const d = getInputs();
    if (validate(d)) return;
    const bmr = calcBMR(d.weightKg, d.heightCm, d.age, d.sex);
    renderMacros(macros(bmr, d.weightKg, d.activityLevel, d.diet));
  });
});
