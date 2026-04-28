export const sizeGuideImage = '/images/womens-size-guide-v2.png';

export const kurtaTopRows = [
  { size: 'XXS', bust: '32', upperWaist: '24', lowerWaist: '30', hip: '36', armhole: '7.75' },
  { size: 'XS', bust: '34', upperWaist: '26', lowerWaist: '32', hip: '38', armhole: '8.5' },
  { size: 'S', bust: '36', upperWaist: '28', lowerWaist: '34', hip: '40', armhole: '8.75' },
  { size: 'M', bust: '38', upperWaist: '30', lowerWaist: '36', hip: '42', armhole: '9' },
  { size: 'L', bust: '40', upperWaist: '32', lowerWaist: '38', hip: '44', armhole: '9.25' },
  { size: 'XL', bust: '42', upperWaist: '34', lowerWaist: '40', hip: '46', armhole: '9.5' },
  { size: '2XL', bust: '44', upperWaist: '36', lowerWaist: '43', hip: '48', armhole: '10' },
  { size: '3XL', bust: '46', upperWaist: '38', lowerWaist: '45', hip: '51', armhole: '10.5' },
  { size: '4XL', bust: '48', upperWaist: '41', lowerWaist: '48', hip: '54', armhole: '11' },
  { size: '5XL', bust: '50', upperWaist: '45', lowerWaist: '50', hip: '56', armhole: '11.5' },
  { size: '6XL', bust: '52', upperWaist: '52', lowerWaist: '52', hip: '58', armhole: '12' },
];

export const pantRows = [
  { size: 'S', waistRelaxed: '28', waistStretched: '29.5', hip: '48', length: '39', cuff: '13' },
  { size: 'M', waistRelaxed: '30', waistStretched: '31.5', hip: '50', length: '39', cuff: '15' },
  { size: 'L', waistRelaxed: '32', waistStretched: '33.5', hip: '52', length: '39', cuff: '15' },
  { size: 'XL', waistRelaxed: '34', waistStretched: '35.5', hip: '54', length: '39', cuff: '16' },
  { size: '2XL', waistRelaxed: '36', waistStretched: '37.5', hip: '56', length: '39', cuff: '16' },
  { size: '3XL', waistRelaxed: '38', waistStretched: '39.5', hip: '58', length: '39', cuff: '17' },
];

export const measurementNotes = [
  { term: 'Bust', copy: 'Measure around the fullest part of your bust while keeping the tape level.' },
  { term: 'Shoulder', copy: 'Measure straight from one shoulder point to the other.' },
  { term: 'Upper Waist', copy: 'Measure around your natural waist, usually the narrowest part of the torso.' },
  { term: 'Lower Waist', copy: 'Measure where the kurta or pant waistband naturally sits.' },
  { term: 'Hip', copy: 'Measure around the fullest part of your hips.' },
  { term: 'Length', copy: 'Measure from the high shoulder point to your preferred hem.' },
  { term: 'Inseam', copy: 'Measure from the inner thigh seam to the ankle.' },
  { term: 'Outseam', copy: 'Measure from waist to ankle along the outside of the leg.' },
  { term: 'Armhole', copy: 'Measure around the arm opening for comfort and movement.' },
];

export const fitTips = [
  'All measurements are in inches and refer to finished garment measurements unless noted.',
  'Keep 1-2 inches of ease around bust and hip if you prefer a relaxed streetwear fit.',
  'If you are between two sizes, choose the larger size for kurtas and co-ord sets.',
  'Compare these numbers with a similar garment that fits you well for the most accurate choice.',
  'Allow a slight variation because fabric, wash, and manual measurement can change the final fit.',
];

export const sizeChartRows = kurtaTopRows
  .filter((row) => ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].includes(row.size))
  .map((row) => ({
    size: row.size,
    chest: row.bust,
    waist: row.upperWaist,
    length: 'Style based',
  }));
