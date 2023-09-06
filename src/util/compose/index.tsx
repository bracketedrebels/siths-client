import { FunctionComponent, ReactNode } from "react";

/**
 * Allows you to compose list of components
 * into nested structure
 *
 * @param providers
 * @returns
 */
export default function compose(
  ...providers: FunctionComponent<{
    children?: ReactNode[] | ReactNode | null;
  }>[]
) {
  return providers.reduce((Prev, Curr) => ({ children }) => (
    <Prev>
      <Curr>{children}</Curr>
    </Prev>
  ));
}
