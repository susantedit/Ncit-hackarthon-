import { Router } from 'express'
import GovernmentService from '../models/GovernmentService.js'

const router = Router()

// GET /api/government/services
router.get('/services', async (req, res) => {
  try {
    const { search, category, limit = 20 } = req.query
    const query = {}
    if (category) query.category = category
    if (search) {
      query.$or = [
        { serviceName: new RegExp(search, 'i') },
        { keywords: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ]
    }
    const services = await GovernmentService.find(query).limit(parseInt(limit, 10) || 20).lean()
    res.json(services)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/government/services/:id
router.get('/services/:id', async (req, res) => {
  try {
    const service = await GovernmentService.findById(req.params.id).lean()
    if (!service) return res.status(404).json({ error: 'Service not found' })
    res.json(service)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/government/seed
router.post('/seed', async (req, res) => {
  try {
    const count = await GovernmentService.countDocuments()
    if (count > 0) return res.json({ message: `Already have ${count} records.` })
    await GovernmentService.insertMany(SEED_SERVICES)
    res.json({ message: `Seeded ${SEED_SERVICES.length} government services.` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const SEED_SERVICES = [
  {
    serviceName: 'Citizenship Certificate (Nagarikta)',
    category: 'identity',
    keywords: ['citizenship', 'nagarikta', 'nागरिकता', 'identity', 'certificate'],
    requiredDocuments: ['Birth certificate', 'Parent citizenship certificate', 'Ward recommendation letter', '2 passport-size photos'],
    fees: 'Free',
    processingTime: '1–3 working days',
    office: 'District Administration Office (DAO)',
    location: 'Your district headquarters',
    eligibility: 'Nepali citizens by birth, descent, or naturalization',
    description: 'Nepali citizenship certificate is the primary identity document issued by the District Administration Office.',
    officialNotes: 'Both parents must accompany minor applicants. Original documents required.',
    steps: [
      'Collect recommendation letter from your Ward Office',
      'Fill in the citizenship application form at the DAO',
      'Submit documents along with photos',
      'Biometric data (thumbprint) is collected on the spot',
      'Collect your citizenship certificate within 1–3 days',
    ],
  },
  {
    serviceName: 'Passport Application',
    category: 'travel',
    keywords: ['passport', 'travel document', 'visa', 'abroad', 'international'],
    requiredDocuments: ['Citizenship certificate (original + copy)', 'Birth certificate', '2 passport-size photos (blue background)', 'Filled application form'],
    fees: 'NPR 5,000 (regular, 10 years) / NPR 10,000 (express)',
    processingTime: '15–30 working days (regular) / 3–5 days (express)',
    office: 'Department of Passports, Narayanhiti, Kathmandu',
    location: 'Narayanhiti, Kathmandu (head office); regional offices in major cities',
    eligibility: 'All Nepali citizens with valid citizenship certificate',
    description: 'Nepali passport is issued by the Department of Passports for international travel.',
    officialNotes: 'Online appointment booking is available at passport.nepal.gov.np',
    steps: [
      'Book an appointment online at passport.nepal.gov.np',
      'Fill the online application form and print the confirmation',
      'Visit the passport office on your appointment date with all documents',
      'Biometric data and signature will be collected',
      'Pay the fee at the office counter',
      'Collect passport at the specified date or via courier',
    ],
  },
  {
    serviceName: 'Voter ID Card',
    category: 'identity',
    keywords: ['voter', 'matdata', 'election', 'vote', 'मतदाता परिचय'],
    requiredDocuments: ['Citizenship certificate', 'Ward registration proof', 'Photo'],
    fees: 'Free',
    processingTime: '7–14 working days',
    office: 'Election Commission Office / Ward Office',
    location: 'Local ward office or district election office',
    eligibility: 'Nepali citizens aged 18 or above',
    description: 'Voter ID card is issued by the Election Commission of Nepal for electoral participation.',
    officialNotes: 'Enrolment in voter list must be done before applying for the card.',
    steps: [
      'Register your name in the voter list at your Ward Office',
      'Apply for voter card with citizenship certificate and photo',
      'Verification is done by the Ward Office',
      'Collect voter ID card from the Ward Office',
    ],
  },
  {
    serviceName: 'PAN Card (Permanent Account Number)',
    category: 'tax',
    keywords: ['PAN', 'permanent account number', 'tax', 'business', 'income tax', 'IRD'],
    requiredDocuments: ['Citizenship certificate', 'Filled PAN registration form', 'Passport-size photo'],
    fees: 'Free',
    processingTime: '1 working day',
    office: 'Inland Revenue Department (IRD) or Tax Office',
    location: 'Your district tax office or online via IRD portal',
    eligibility: 'All individuals earning taxable income or running a business',
    description: 'PAN is mandatory for all taxpayers, businesses, and individuals with taxable income in Nepal.',
    officialNotes: 'Online PAN registration available at ird.gov.np',
    steps: [
      'Visit ird.gov.np and fill the online PAN registration form',
      'Upload required documents',
      'Submit the form and note the application number',
      'Visit the tax office if physical verification is required',
      'PAN number is issued immediately; card may take a few days',
    ],
  },
  {
    serviceName: 'Birth Registration',
    category: 'vital-registration',
    keywords: ['birth', 'janma', 'registration', 'certificate', 'janma dartaa', 'जन्म दर्ता'],
    requiredDocuments: ['Hospital birth certificate or midwife certificate', 'Parent citizenship certificates', 'Filled application form'],
    fees: 'Free (within 35 days), NPR 50 (after 35 days)',
    processingTime: 'Same day',
    office: 'Ward Office / Municipality Office',
    location: 'Your local ward or municipality',
    eligibility: 'All newborns and unregistered persons born in Nepal',
    description: 'Birth registration is mandatory for all children born in Nepal and is the basis for all future documents.',
    officialNotes: 'Registration within 35 days of birth is free. Late registration requires a small fee.',
    steps: [
      'Obtain hospital/birth certificate from the delivery location',
      'Visit your local Ward Office with parent citizenship documents',
      'Fill the birth registration form',
      'Submit documents',
      'Birth certificate is issued on the same day',
    ],
  },
  {
    serviceName: 'Land Ownership Certificate (Lalpurja)',
    category: 'land',
    keywords: ['land', 'lalpurja', 'property', 'deed', 'ownership', 'जग्गा', 'लालपुर्जा'],
    requiredDocuments: ['Existing land documents', 'Citizenship certificate', 'Tax clearance receipt', 'Survey field book (Naksaa)'],
    fees: 'Varies by land value',
    processingTime: '3–7 working days',
    office: 'Land Revenue Office (Malpot Karyalaya)',
    location: 'Your district Land Revenue Office',
    eligibility: 'Landowners and buyers/sellers of land',
    description: 'Official land ownership certificate issued by the Land Revenue Office for legal land ownership in Nepal.',
    steps: [
      'Collect documents from the Land Revenue Office',
      'Pay applicable taxes and fees',
      'Submit application with all documents',
      'Field inspection may be required',
      'Collect the lalpurja after processing',
    ],
  },
  {
    serviceName: 'Marriage Registration',
    category: 'vital-registration',
    keywords: ['marriage', 'vivah', 'bibaha', 'registration', 'certificate', 'विवाह दर्ता'],
    requiredDocuments: ['Citizenship certificates of both parties', 'Age proof', '2 witnesses with their citizenship copies', 'Filled application form'],
    fees: 'NPR 100–500 depending on the office',
    processingTime: 'Same day to 3 working days',
    office: 'Ward Office or District Court',
    location: 'Local ward office or district court',
    eligibility: 'Citizens of legal marriage age (20 for males, 20 for females)',
    description: 'Official registration of marriage in Nepal, legally recognized and required for family documentation.',
    steps: [
      'Both parties visit the Ward Office together with 2 witnesses',
      'Fill marriage registration form',
      'Submit citizenship documents and photos',
      'Pay the applicable fee',
      'Marriage certificate is issued',
    ],
  },
  {
    serviceName: 'Driving License',
    category: 'transport',
    keywords: ['driving', 'license', 'vehicle', 'bike', 'car', 'transport', 'chalak', 'चालक अनुमतिपत्र'],
    requiredDocuments: ['Citizenship certificate', 'Blood group certificate', 'Medical fitness certificate', 'Passport-size photos', 'Application form'],
    fees: 'NPR 3,000–5,000 depending on category',
    processingTime: '15–30 days after passing the test',
    office: 'Department of Transport Management (DOTM)',
    location: 'Ekantakuna, Lalitpur (headquarters); regional offices in all provinces',
    eligibility: 'Citizens aged 16+ for motorcycle, 18+ for car',
    description: 'Driving license issued by DOTM after passing written and practical tests.',
    steps: [
      'Register at dotm.gov.np and fill the online application',
      'Pay the fee and get trial slip',
      'Attend the written trial examination',
      'If passed, book a date for practical trial',
      'Pass the practical test',
      'Biometric data collected',
      'License issued within 15–30 days',
    ],
  },
]

export default router
