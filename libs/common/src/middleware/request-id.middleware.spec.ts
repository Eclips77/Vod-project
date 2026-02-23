import { RequestIdMiddleware } from './request-id.middleware';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
    req = {
      headers: {},
    };
    res = {
      setHeader: jest.fn(),
    } as unknown as Partial<Response>;
    next = jest.fn();
    (uuidv4 as jest.Mock).mockReturnValue('mock-uuid');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should generate a new traceId if x-request-id header is missing', () => {
    middleware.use(req as Request, res as Response, next);

    expect((req as any).traceId).toBe('mock-uuid');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'mock-uuid');
    expect(next).toHaveBeenCalled();
    expect(uuidv4).toHaveBeenCalled();
  });

  it('should use existing traceId if x-request-id header is present', () => {
    req.headers = { 'x-request-id': 'existing-uuid' };
    middleware.use(req as Request, res as Response, next);

    expect((req as any).traceId).toBe('existing-uuid');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'existing-uuid');
    expect(next).toHaveBeenCalled();
    expect(uuidv4).not.toHaveBeenCalled();
  });
});
