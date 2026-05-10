import { RECOVERY_PHRASE_WORDS, generateRecoveryPhrase as generateBip39Phrase } from "./recoveryPhrase";

export const RECOVERY_WORDS = RECOVERY_PHRASE_WORDS;

export const generateRecoveryPhrase = () => generateBip39Phrase();
