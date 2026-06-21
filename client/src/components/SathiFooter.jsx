import { BRAND } from '../utils/brand'

export default function SathiFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text3)',
        fontSize: 12,
      }}
    >
      Built for the {BRAND.hackathon} &nbsp;|&nbsp;
      {BRAND.institution} &nbsp;|&nbsp;
      Team {BRAND.team} &nbsp;|&nbsp;
      &copy; {BRAND.year} {BRAND.name}
    </footer>
  )
}
