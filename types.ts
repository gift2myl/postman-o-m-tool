
export interface PostmanHeader {
  key: string;
  value: string;
  name?: string;
  type?: string;
}

export interface PostmanBody {
  mode: string;
  raw: string;
}

export interface PostmanRequest {
  method: string;
  header: PostmanHeader[];
  body: PostmanBody;
  url: string | { raw: string };
}

export interface PostmanItem {
  name: string;
  request: PostmanRequest;
  response: any[];
  _id?: string;
}

export interface PostmanCollection {
  info: {
    _postman_id: string;
    name: string;
    schema: string;
  };
  item: PostmanItem[];
}
