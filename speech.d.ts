// speech.d.ts

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
  // Possible other properties based on the specific browser implementation
  // For example, Emma XML data or interpretation:
  // readonly emma?: Document | null;
  // readonly interpretation?: any;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event { // Standard name is SpeechRecognitionErrorEvent
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string; // Optional additional message
}

type SpeechRecognitionErrorCode =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-allowed"
  | "bad-grammar"
  | "language-not-supported";


interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  // serviceURI: string; // This property is deprecated

  start(): void;
  stop(): void;
  abort(): void;

  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;

  addEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof SpeechRecognitionEventMap>(type: K, listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

declare var SpeechRecognition: SpeechRecognitionStatic | undefined;
declare var webkitSpeechRecognition: SpeechRecognitionStatic | undefined; // For vendor prefix

interface SpeechGrammar {
  src: string;
  weight?: number;
}
declare var SpeechGrammar: {
  prototype: SpeechGrammar;
  new(): SpeechGrammar;
};

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
}
declare var SpeechGrammarList: {
  prototype: SpeechGrammarList;
  new(): SpeechGrammarList;
} | undefined;
declare var webkitSpeechGrammarList: {
  prototype: SpeechGrammarList;
  new(): SpeechGrammarList;
} | undefined;


interface SpeechRecognitionEventMap {
  "audiostart": Event;
  "audioend": Event;
  "end": Event;
  "error": SpeechRecognitionErrorEvent;
  "nomatch": SpeechRecognitionEvent;
  "result": SpeechRecognitionEvent;
  "soundstart": Event;
  "soundend": Event;
  "speechstart": Event;
  "speechend": Event;
  "start": Event;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionStatic;
  webkitSpeechRecognition?: SpeechRecognitionStatic;
  SpeechGrammarList?: { new(): SpeechGrammarList };
  webkitSpeechGrammarList?: { new(): SpeechGrammarList };
}
