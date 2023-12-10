import { type StoryFn, type Meta, moduleMetadata, applicationConfig  } from '@storybook/angular';
import { CarouselExampleComponent } from '../../../app/components';
import { CommonModule } from '@angular/common';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export default {
  title: 'Material/Carousel/Primary',
  component: CarouselExampleComponent,
  decorators: [
    applicationConfig({
      providers: [provideAnimationsAsync()],
    }), 
    moduleMetadata({
      imports: [CommonModule],
      declarations: [],
      providers: [],
    })
  ],
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/angular/configure/story-layout
    layout: 'centered',
    options: { showPanel: false }
  },
} as Meta;

const Template: StoryFn<CarouselExampleComponent> = (args: CarouselExampleComponent) => ({
  props: args
});

export const Primary = Template.bind({});
Primary.args = {
  items: [
    {
      "title": "Đây là data Ads demo 4",
      "description": "Đây là data Ads demo 4. Thật đấy",
      "image": "/images/accessibility.png",
      "routeLink": "/test/ahihi4"
    },
    {
      "title": "Đây là data Ads demo 6",
      "description": "Đây là data Ads demo 6. Thật đấy",
      "image": "/images/addon-library.png",
      "routeLink": "/test/ahihi6"
    },
    {
      "title": "Đây là data Ads demo 5",
      "description": "Đây là data Ads demo 5. Thật đấy",
      "image": "/images/assets.png",
      "routeLink": "/test/ahihi5"
    }
  ]
};

