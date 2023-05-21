### 타입

- 단수형이 기본

### 풀더 구조

```
src
|- 타입 이름
    |- api
       |- 타입 이름.api.ts: 타입 정의, endpoint, 예외 정의
       |- 타입 이름.schema.ts: 타입의 zod 스키마 정의
    |- dto
        |- 타입 이름.redis.ts: redis 에 저장할 데이터 타입 정의
    |- 타입 이름 + Updator.ts: 실제로 데이터를 받아오는 로직 정의
```

### 클래스

- 타입 이름 + Updator

### 변수

- endpoint 가 filter 등 인자를 받는 경우 => 해당 endpoint 에서 처리하고자 하는 상황
- endpoint 가 아무 인자도 받지 않는 경우 => 해당 endpoint 에서 반환하는 데이터 타입 이름
- 42 intra 에서 받아온 데이터들 => 타입이름 + Dtos
  - 사실 dtos 로 충분히 의미를 나타낼 수 있음...

### api 마다 정의해야 하는 함수

- 복수의 dto 들을 파싱해주는 함수 => parse + 타입 이름 + s

### schema

- passthrough 는 dto 에서 누락시키는 부분이 있는 경우 사용
  - 이는 결국 42 api 에 대한 이해 부족이나 불필요한 정보가 과도하게 많은 경우 생김
  - 추후 프로젝트가 커지면서 처리하는 api 가 늘어나면, 이 부분이 모두 사라질 수 있음 (이 시점에는 db 도 rdbms 사용하는 것도 고려 가능함)
- xxx.schema.base.ts 파일에선, 순환 참조를 막기 위한 base schema 를 선언
  - 단, 순환 참조가 발생하는 type 만 별도의 파일을 필요로 하기 때문에, 일단 scale team 만 별도 파일로 분리한 상태
