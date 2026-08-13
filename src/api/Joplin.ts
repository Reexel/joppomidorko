import { JoplinPlugins } from './JoplinPlugins';
import { JoplinViews } from './JoplinViews';
import { JoplinWorkspace } from './JoplinWorkspace';
import { JoplinSettings } from './JoplinSettings';
import { JoplinCommands } from './JoplinCommands';
import { JoplinData } from './JoplinData';

export class Joplin {
    public plugins: JoplinPlugins;
    public views: JoplinViews;
    public workspace: JoplinWorkspace;
    public settings: JoplinSettings;
    public commands: JoplinCommands;
    public data: JoplinData;
}
