import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type Lang, t as translate, type TranslationKey } from './translations'

interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
})

const STORAGE_KEY = 'autopost_lang'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'ro' || stored === 'en') return stored
    } catch {}
    return 'en'
  })

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    try { localStorage.setItem(STORAGE_KEY, newLang) } catch {}
  }, [])

  const tFn = useCallback((key: TranslationKey) => translate(key, lang), [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: tFn }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
