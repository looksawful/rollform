import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import CubeOutline from './CubeOutline';

const meta = {
  title: 'Components/Cube outline',
  component: CubeOutline,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CubeOutline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dark: Story = {
  decorators: [
    (StoryComponent) => (
      <div style={{ background: '#151515', color: '#ffffff', padding: 48 }}>
        <StoryComponent />
      </div>
    ),
  ],
};
