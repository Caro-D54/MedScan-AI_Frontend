declare module 'react-test-renderer' {
  const content: any;
  export const act: (callback: () => Promise<void> | void) => Promise<void>;
  export default content;
}
