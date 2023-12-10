import type { StoryFn, Meta } from '@storybook/angular';
import { PdfExampleComponent } from '../../app/components';

export default {
  title: 'Pdf/Primary',
  component: PdfExampleComponent,
  decorators: [],
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/angular/configure/story-layout
    layout: 'fullscreen',
    options: { showPanel: false }
  },
} as Meta;

const Template: StoryFn<PdfExampleComponent> = (args: PdfExampleComponent) => ({
  props: args,
});

export const Primary = Template.bind({});
Primary.args = {
  lightSrc: '/example.pdf',
  heavySrc: '/example-2.pdf'
};

