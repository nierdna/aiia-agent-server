export enum Platform {
  TELEGRAM = 'telegram',
  DISCORD = 'discord',
  X = 'x',
}

export enum EAIModel {
  GPT4_1106 = 'gpt-4-1106-preview',
  GPT4_TURBO_2024_04_09 = 'gpt-4-turbo-2024-04-09',
  GPT3_5_TURBO_0125 = 'gpt-3.5-turbo-0125',
  GPT_4O_MINI = 'gpt-4o-mini',
}

export enum ETwitterPostStatus {
  Init = 'Init',
  Processing = 'Processing',
  Success = 'Success',
  Failed = 'Failed',
}

export enum ERequestCheckKolShilledStatus {
  Init = 'Init',
  FetchedShilledToken = 'FetchedShilledToken',
  Success = 'Success',
  ErrorAtFetchShilledToken = 'ErrorAtFetchShilledToken',
  ErrorAtReplyCheckKolCalled = 'ErrorAtReplyCheckKolCalled',
}
