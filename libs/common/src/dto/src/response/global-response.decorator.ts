import { applyDecorators, Type } from "@nestjs/common";
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { GlobalResponse } from "./global-response.dto";
import { PaginationMetaDto } from "./pagination-meta.dto";

type ApiResponseOption = {
  status: number;
  message: string;
  errorType?: string;
  dataExample?: unknown;
};

type ApiSimpleResponseOptions = {
  success?: ApiResponseOption;
  conflict?: ApiResponseOption;
  badRequest?: ApiResponseOption;
  notFound?: ApiResponseOption;
};

export const ApiPaginatedResponse = <TModel extends Type<unknown>>(
  model: TModel,
  defaultStatusCode: number = 200,
) => {
  return applyDecorators(
    ApiExtraModels(GlobalResponse, PaginationMetaDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(GlobalResponse) },
          {
            properties: {
              statusCode: { type: "number", default: defaultStatusCode },
              data: {
                type: "array",
                items: { $ref: getSchemaPath(model) },
              },
              meta: { $ref: getSchemaPath(PaginationMetaDto) },
            },
          },
        ],
      },
    }),
  );
};

export const ApiResponseModel = <TModel extends Type<any>>(
  model?: TModel,
  defaultStatusCode: number = 200,
) => {
  const props: Record<string, any> = {
    statusCode: { type: "number", default: defaultStatusCode },
    message: { type: "string" },
  };

  if (model) {
    props.data = { $ref: getSchemaPath(model) };
  }

  const decorators = [
    ApiExtraModels(GlobalResponse),
    ApiResponse({
      status: defaultStatusCode,
      schema: {
        type: "object",
        properties: props,
      },
    }),
  ];

  if (model) {
    decorators.unshift(ApiExtraModels(model));
  }

  return applyDecorators(...decorators);
};

const buildExample = ({
  status,
  message,
  errorType,
  dataExample,
}: {
  status: number;
  message: string;
  errorType?: string;
  dataExample?: unknown;
}) => {
  const base: Record<string, any> = {
    statusCode: status,
    message,
  };

  if (dataExample !== undefined && dataExample !== null) {
    base.data = dataExample;
  }

  if (errorType) {
    base.error = errorType;
  }

  return base;
};

export const ApiSimpleResponse = (options: ApiSimpleResponseOptions) => {
  const responseEntries = [
    { key: "success", defaultError: undefined },
    { key: "conflict", defaultError: "Conflict" },
    { key: "badRequest", defaultError: "Bad Request" },
    { key: "notFound", defaultError: "Not Found" },
  ] as const;

  const decorators = responseEntries
    .map(({ key, defaultError }) => {
      const value = options[key];
      if (!value) return null;

      return ApiResponse({
        status: value.status,
        description: value.message,
        schema: {
          type: "object",
          example: buildExample({
            ...value,
            errorType: value.errorType ?? defaultError,
          }),
        },
      });
    })
    .filter((d): d is MethodDecorator & ClassDecorator => d !== null);

  return applyDecorators(...decorators);
};

