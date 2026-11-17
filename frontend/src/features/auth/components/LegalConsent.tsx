import { env } from '@/lib/env'

interface LegalConsentProps {
  action: string
}

export function LegalConsent({ action }: LegalConsentProps) {
  const link = 'font-semibold text-text-2 underline underline-offset-2 hover:text-text'
  return (
    <p className="mt-3 text-center text-[12.5px] leading-relaxed text-text-3">
      {action}, você concorda com os{' '}
      <a href={`${env.siteUrl}/termos/`} target="_blank" rel="noopener" className={link}>
        Termos de uso
      </a>{' '}
      e com a{' '}
      <a href={`${env.siteUrl}/privacidade/`} target="_blank" rel="noopener" className={link}>
        Política de privacidade
      </a>
      .
    </p>
  )
}
