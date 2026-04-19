---
title: "About FitMetrics"
subtitle: "The evidence behind every number we show you"
---

FitMetrics is a free, open-source health calculator built on peer-reviewed clinical research. Every formula, threshold, and recommendation on this site has a published basis — and this page explains what that basis is.

We don't sell supplements, coaching programs, or meal plans. The goal is simply to put clinically validated numbers in your hands in a form that's easy to understand and act on.

---

## Body Fat Percentage — U.S. Navy Circumference Method

Body fat percentage is a more informative measure of body composition than weight or BMI alone, because it distinguishes metabolically active lean tissue (muscle, bone, organs) from adipose tissue. The U.S. Navy circumference method estimates body fat from a small set of simple tape measurements and has been validated against more resource-intensive reference methods.

### The Formulas

**Men** (requires height, waist, neck):

> %BF = 86.010 × log₁₀(waist − neck) − 70.041 × log₁₀(height) + 36.76

**Women** (requires height, waist, neck, hip):

> %BF = 163.205 × log₁₀(waist + hip − neck) − 97.684 × log₁₀(height) − 78.387

All measurements are in inches. Waist is measured at the narrowest point (navel level for men, narrowest circumference for women); neck is measured just below the larynx; hip is measured at the widest point of the buttocks (women only).

### Why the Navy Method?

The Navy method was developed by Hodgdon and Beckett (1984) at the Naval Health Research Center as a practical field alternative to underwater weighing (hydrostatic densitometry), which was the gold-standard method at the time but requires specialized equipment and facilities.

<div class="evidence-box"><strong>Validation:</strong> Hodgdon & Beckett (1984) derived the circumference-based equations by regressing tape measurements against percent body fat determined by hydrostatic weighing in a large sample of Navy personnel. The method explained approximately 85–90% of the variance in measured body fat in the development sample.</div>

### Accuracy and Limitations

The Navy method is a **field estimation tool**, not a clinical measurement. Its accuracy compared to reference methods has been studied extensively:

<div class="evidence-box"><strong>Accuracy data:</strong> Friedl et al. (1992) evaluated the Navy method against dual-energy X-ray absorptiometry (DEXA) and hydrostatic weighing in military populations. The standard error of estimate was approximately ±3–4% body fat — acceptable for population screening and self-monitoring, but not for clinical precision. Similar findings have been reported by Carey (2009) and Peterson et al. (2003).</div>

**Known sources of error:**
- **Measurement technique** is the largest variable. Waist, neck, and hip circumferences must be measured consistently — small errors in placement compound in the logarithmic formula. FitMetrics displays results to one decimal place, but the practical precision of self-measurement is closer to ±1–2%.
- **Body shape variation.** People with the same body fat percentage can have different circumference distributions, particularly across ethnicities. The equations were derived primarily from military populations and may systematically over- or under-estimate body fat in other groups.
- **Sex differences.** The separate male and female equations account for different fat distribution patterns (android vs. gynoid), but within-sex variation in fat distribution still limits precision.
- **Age.** Older adults tend to have greater central fat deposition at a given total body fat percentage, which can cause the method to overestimate body fat in this population.

### How It Compares to Other Methods

| Method | Accuracy (±% BF) | Equipment needed | Cost |
|--------|-----------------|-----------------|------|
| DEXA scan | ±1–2% | Clinical scanner | High |
| Hydrostatic weighing | ±1–3% | Water tank, lab | High |
| Air displacement (Bod Pod) | ±2–3% | Specialized pod | High |
| Skinfold calipers | ±3–5% | Calipers, training | Low |
| **Navy circumference** | **±3–4%** | **Tape measure** | **Free** |
| BIA (consumer scales) | ±4–8% | Smart scale | Low–medium |
| BMI-based estimates | ±5–8% | None | Free |

The Navy method compares favorably to other low-cost approaches — particularly consumer bioelectrical impedance scales, whose accuracy is highly sensitive to hydration status and time of day — while requiring nothing more than a flexible measuring tape.

### Body Fat Classification

FitMetrics uses the **American Council on Exercise (ACE)** body fat classification system:

| Category | Men | Women |
|----------|-----|-------|
| Essential Fat | <6% | <14% |
| Athletic | 6–13% | 14–20% |
| Fitness | 14–17% | 21–24% |
| Average | 18–24% | 25–31% |
| High | ≥25% | ≥32% |

These thresholds reflect population norms and general health risk associations rather than absolute clinical cutoffs. "Essential fat" represents the minimum required for physiological function (organ protection, hormone production, nerve insulation). "Athletic" reflects the range typical of competitive athletes. Health risks associated with excess body fat include insulin resistance, dyslipidemia, cardiovascular disease, and certain cancers — independent of BMI.

<div class="evidence-box"><strong>Note:</strong> The Navy method requires waist and neck circumference for men, and waist, neck, and hip circumference for women. If these optional measurements are not entered in the calculator, the body fat card will not appear. Hip circumference is only shown in the input form when Female is selected as biological sex.</div>

---

## Body Mass Index (BMI)

BMI is calculated as weight (kg) ÷ height (m)². It is a population-level screening tool developed in the 19th century and validated repeatedly as a predictor of metabolic risk across large cohorts.

**Limitations:** BMI does not distinguish between fat mass and lean mass. A heavily muscled individual may register as "overweight" while carrying very little body fat, and an elderly person with low muscle mass may appear "normal" while carrying excess visceral fat. For this reason, FitMetrics pairs BMI with waist-to-height ratio, which captures central adiposity more directly.

**Thresholds used:** WHO/NIH standard categories (underweight <18.5, normal 18.5–24.9, overweight 25–29.9, obese ≥30).

---

## Basal Metabolic Rate (BMR)

BMR is the number of calories your body burns at complete rest — the minimum energy required to sustain basic physiological functions.

**Formula:** We use the **Mifflin-St Jeor equation** (1990), which has been consistently shown to be the most accurate predictive formula for modern populations.

- Men: BMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age) + 5
- Women: BMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age) − 161

<div class="evidence-box"><strong>Evidence:</strong> Frankenfield et al. (2005) compared five predictive equations against indirect calorimetry in 200 subjects and found Mifflin-St Jeor predicted within 10% of measured REE for 82% of participants — outperforming the older Harris-Benedict equation, which was derived from a smaller, less representative 1919 dataset.</div>

**Important context:** BMR reflects energy expenditure at rest. Total daily energy expenditure (TDEE) is higher based on physical activity. FitMetrics uses BMR as the base from which caloric deficits are calculated, which is intentionally conservative — it avoids overestimating how much you can eat.

---

## Waist-to-Height Ratio & Cardiovascular Risk

Waist circumference divided by height is a simple, powerful predictor of cardiometabolic risk. Unlike BMI, it directly reflects central (visceral) adiposity, the fat depot most strongly linked to insulin resistance, dyslipidemia, hypertension, and cardiovascular disease.

**Thresholds:**
- < 0.40: Low risk
- 0.40 – 0.50: Healthy / moderate
- 0.51 – 0.60: High risk (elevated central adiposity)
- > 0.60: Very high risk

<div class="evidence-box"><strong>Evidence:</strong> Ashwell & Hsieh (2005) and Ashwell et al. (2012) demonstrated that WHtR is a superior predictor of metabolic syndrome, diabetes, and cardiovascular events compared to BMI alone, across multiple ethnicities and both sexes. The simple heuristic "keep your waist less than half your height" has been proposed as a public health message applicable globally.</div>

**Sex note:** The calculator uses a unified boundary scale because WHtR thresholds show less sex-based variation than absolute waist circumference thresholds, making the 0.5 boundary broadly applicable. Clinically, women may have slightly more leniency at a given WHtR due to differences in fat distribution patterns.

---

## Protein Intake Recommendations

Protein is the macronutrient most critical for tissue repair, immune function, satiety, and — especially with age — preserving lean muscle mass.

### Baseline (1.0 g/kg body weight)

The classic RDA of 0.8 g/kg was established as the minimum to prevent deficiency in sedentary adults. More recent evidence suggests 1.0 g/kg is a more appropriate baseline for maintaining lean mass in healthy adults with any level of activity.

### Active adults (1.2 – 1.6 g/kg)

Individuals who exercise regularly have greater protein turnover and synthesis requirements. This range is consistent with the American College of Sports Medicine (ACSM) position stand.

### Strength training / athletes (1.6 – 2.0 g/kg)

<div class="evidence-box"><strong>Evidence:</strong> Morton et al. (2018) conducted a meta-analysis of 49 randomized controlled trials (n = 1,863) and found that protein supplementation significantly increased muscle mass and strength gains from resistance training, with a protein intake plateau effect near 1.62 g/kg/day. Intakes up to 2.0 g/kg provide additional support during caloric restriction.</div>

### Age 60+ (1.4 g/kg)

Sarcopenia — the progressive loss of skeletal muscle mass and function — begins in the fourth decade and accelerates after 60. Higher protein intake is one of the most evidence-backed interventions for slowing it.

<div class="evidence-box"><strong>Evidence:</strong> Bauer et al. (2013, ESPEN) recommended 1.0–1.2 g/kg/day for healthy older adults and 1.2–1.5 g/kg/day for those with acute or chronic illness, based on meta-analyses showing reduced muscle loss and improved functional outcomes at higher intakes.</div>

---

## Caloric Deficits & Weight Loss

Weight loss fundamentally requires a sustained caloric deficit — consuming fewer calories than you expend. The body draws on stored energy (primarily fat) to make up the difference.

**Energy density of fat:** Approximately 7,700 kcal per kilogram (or ~3,500 kcal per pound). FitMetrics uses 7,700 kcal/kg in its calculations.

**Why an asymptotic curve?** As body weight decreases, BMR decreases proportionally (since BMR is weight-dependent). If you maintain a fixed caloric intake, the gap between what you eat and what your body needs at rest gradually narrows — weight loss slows and approaches a new equilibrium. This is the physiological reality behind every "plateau" experienced during a diet. The chart on the calculator models this week-by-week rather than showing an unrealistic straight line.

**Deficit levels:**
- **–200 kcal/day:** Very conservative, sustainable indefinitely for most people. Approximately 0.4 lb/week initially, tapering to a plateau over months.
- **–500 kcal/day:** Moderate and widely recommended by clinical guidelines. Approximately 1 lb/week initially.

<div class="evidence-box"><strong>Minimum floors:</strong> 1,500 kcal/day for men and 1,200 kcal/day for women are widely cited clinical thresholds below which micronutrient adequacy becomes difficult to maintain without supplementation, and metabolic adaptation risk increases significantly.</div>

---

## Dietary Approaches & Macronutrients

### Balanced Diet

The default split (≈28% fat, protein by activity, balance as carbohydrates) aligns with USDA Dietary Guidelines and is appropriate for most people without specific metabolic conditions.

### Low Carbohydrate (<50g carbs)

Reduces insulin excursion and promotes greater fat oxidation. Useful for individuals with insulin resistance or prediabetes.

### Very Low Carbohydrate (<30g carbs)

Approaches ketogenic territory. May offer additional benefits for blood glucose management.

### Ketogenic Diet (~25g net carbs)

<div class="evidence-box"><strong>Evidence:</strong> Hallberg et al. (2018) demonstrated significant glycemic improvement and medication reduction in type 2 diabetics following a ketogenic diet over 1 year. Weight loss outcomes are comparable to other approaches at 12+ months (Sackner-Bernstein et al., 2015 meta-analysis), though short-term weight loss tends to be faster due to glycogen and water depletion.</div>

### Carnivore Diet (~0g carbs)

A zero-carbohydrate approach with increasing anecdotal and early research attention. Mechanistically plausible for elimination of certain dietary antigens and ultra-processed foods. Long-term randomized controlled trial data remain limited as of 2025.

---

## Hydration

**Formula used:** 35 ml per kg of body weight per day.

This falls within the range recommended by the European Food Safety Authority (2.0 L/day for women, 2.5 L/day for men total water intake including food) and is a commonly cited clinical rule of thumb. Individual needs are higher with physical activity, hot climates, or illness.

---

## Dietary Fiber

Recommendations are drawn from the **Dietary Reference Intakes (DRI)** established by the Institute of Medicine (now National Academy of Medicine):

| Group | Recommendation |
|-------|---------------|
| Men ≤50 | 38g/day |
| Men >50 | 30g/day |
| Women ≤50 | 25g/day |
| Women >50 | 21g/day |

<div class="evidence-box"><strong>Evidence:</strong> Reynolds et al. (2019, <em>The Lancet</em>) conducted a large systematic review and meta-analysis of 185 prospective studies and 58 clinical trials, finding that higher dietary fiber intake was associated with significant reductions in all-cause mortality, cardiovascular disease, type 2 diabetes, and colorectal cancer. The dose-response was strongest below 25–29g/day, with continued benefit up to and beyond 35g/day.</div>

---

## Daily Steps & Calorie Burn

**Step targets:** 7,500 steps/day (moderate) and 10,000 steps/day (active).

The 10,000 steps target originated from a 1965 Japanese marketing campaign for a pedometer — not from clinical research. More recent data suggests meaningful benefit occurs at lower step counts.

<div class="evidence-box"><strong>Evidence:</strong> Saint-Maurice et al. (2020, <em>JAMA Internal Medicine</em>) found that adults taking 7,000–8,000 steps/day had significantly lower all-cause mortality risk compared to those taking fewer steps, with diminishing returns beyond 10,000 steps. Paluch et al. (2022, <em>JAMA Network Open</em>) confirmed these findings across age groups.</div>

**Calorie burn estimate:** Uses MET (metabolic equivalent of task) of 3.5 for brisk walking (reduced to 3.2 for adults over 60), multiplied by body weight and estimated walking duration (~100 steps/minute). This is an approximation; actual burn varies by stride length, terrain, and fitness level.

---

## Heart Rate Zones

### Maximum Heart Rate

Two sex-specific equations are used in place of the widely cited but imprecise "220 − age" formula:

- **Men:** 208 − (0.7 × age) — Tanaka, Monahan & Seals (2001)
- **Women:** 206 − (0.88 × age) — Gulati et al. (2010)

<div class="evidence-box"><strong>Evidence:</strong> Tanaka et al. (2001) derived their formula from a meta-analysis of 351 published studies (n = 18,712) and validated it against direct measurement. The classic 220−age formula overestimates HRmax in older individuals and underestimates it in younger ones by a clinically meaningful margin.</div>

### Zone 2 Training

Zone 2 (60–70% of HRmax) represents the highest intensity at which fat oxidation is maximized and the primary fuel source remains fatty acids rather than glucose. It corresponds roughly to a pace at which you can hold a conversation but feel sustained effort.

<div class="evidence-box"><strong>Evidence:</strong> Research by Seiler & Tønnessen (2009) established the "80/20 rule" in endurance athletes — elite performers spend approximately 80% of training time in low-intensity zones (primarily Zone 2) and 20% at high intensity. Iñigo San Millán and George Brooks (2022) demonstrated that Zone 2 training specifically increases mitochondrial density and function, improves lactate clearance capacity, and enhances metabolic flexibility (the ability to efficiently switch between fat and carbohydrate oxidation). These adaptations are associated with improved insulin sensitivity, cardiovascular efficiency, and long-term health outcomes.</div>

---

*FitMetrics is not a medical device and does not provide medical advice. All calculations are estimates based on population-level research and may not reflect individual variation. Consult a qualified healthcare provider before making significant changes to your diet or exercise program.*
