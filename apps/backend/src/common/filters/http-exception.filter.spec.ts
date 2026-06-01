import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  const mockResponse = () => {
    const res = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    return res;
  };

  const mockHost = (res: ReturnType<typeof mockResponse>) => ({
    switchToHttp: () => ({
      getResponse: () => res,
    }),
  });

  it('maps validation errors to ApiResponse', () => {
    const res = mockResponse();
    filter.catch(new BadRequestException('Invalid input'), mockHost(res) as never);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      errorCode: ErrorCode.VALIDATION_ERROR,
      message: 'Invalid input',
    });
  });

  it('preserves explicit errorCode on HttpException body', () => {
    const res = mockResponse();
    filter.catch(
      new HttpException(
        { errorCode: ErrorCode.API_KEY_INVALID, message: 'Invalid API key' },
        HttpStatus.UNAUTHORIZED,
      ),
      mockHost(res) as never,
    );

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      errorCode: ErrorCode.API_KEY_INVALID,
      message: 'Invalid API key',
    });
  });

  it('maps not found errors', () => {
    const res = mockResponse();
    filter.catch(new NotFoundException(), mockHost(res) as never);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      errorCode: ErrorCode.NOT_FOUND,
      message: 'Not Found',
    });
  });
});
