import { HttpStatus } from '@nestjs/common';

export default function handleResponse(
  data: any = {},
  status_code: number = HttpStatus.OK,
  msg: string = 'Success',
) {
  return { messages: msg, data, status_code };
}
