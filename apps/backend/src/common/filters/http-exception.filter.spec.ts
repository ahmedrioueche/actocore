import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  const mockResponse = () => {
    const res = {
      headersSent: false,
      status: jest.fn(),
      json: jest.fn(),
    };
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

  it('preserves retryAfterSeconds details on conflict errors', () => {
    const res = mockResponse();
    filter.catch(
      new ConflictException({
        errorCode: ErrorCode.TEST_ACCOUNT_IN_USE,
        message: 'This demo account is currently in use.',
        details: { retryAfterSeconds: 900 },
      }),
      mockHost(res) as never,
    );

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      errorCode: ErrorCode.TEST_ACCOUNT_IN_USE,
      message: 'This demo account is currently in use.',
      details: { retryAfterSeconds: 900 },
    });
  });

  it('skips response when headers were already sent', () => {
    const res = mockResponse();
    res.headersSent = true;
    filter.catch(new NotFoundException(), mockHost(res) as never);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
