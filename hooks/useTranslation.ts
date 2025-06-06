import { useTranslationContext } from '../contexts/TranslationContext';

export const useTranslation = () => {
  return useTranslationContext();
};

export default useTranslation;