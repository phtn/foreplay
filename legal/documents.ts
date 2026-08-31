export interface Heading {
  id: string
  text: string
  level: number
}

export interface LegalDocument {
  slug: string
  title: string
  description: string
  content?: string
  headings?: Heading[]
}

export const legalDocuments: LegalDocument[] = [
  {
    slug: 'terms-of-use',
    title: 'Terms of Use',
    description: 'Our terms and conditions for using this website'
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    description: 'How we collect and use your information'
  },
  {
    slug: 'purchase-agreement',
    title: 'Purchase Agreement',
    description: 'Our policies regarding purchases and returns'
  }
]
