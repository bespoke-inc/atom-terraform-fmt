'use babel';

import { CompositeDisposable, BufferedProcess } from 'atom';

// Modified from
// https://github.com/chrw/atom-hclfmt/blob/188d119bb6f6ab1996beaa57860343b93a57705b/lib/hclfmt.js
export default {
    config: {
        fmtOnSave: {
            type: 'boolean',
            default: true,
            title: 'Format on save'
        },
        binPath: {
            type: 'string',
            default: 'terraform',
            title: 'Path to the terraform executable'
        },
        useRelativePath: {
            type: 'boolean',
            default: true,
            title: 'Run terraform fmt relative to the current project dir'
        },
        debugMode: {
            type: 'boolean',
            default: false,
            title: 'Enable debug mode (show stdout, stderr and exit in console)'
        }
    },

    activate(state) {
        this.subscriptions = new CompositeDisposable();

        this.subscriptions.add(atom.workspace.observeTextEditors((textEditor) => {
            this.subscriptions.add(textEditor.onDidSave((event) => {
                if (textEditor.getGrammar().scopeName != 'source.terraform') return;
                if (!atom.config.get('terraform-fmt.fmtOnSave')) return;
                this.format(event.path);
            }));
        }));

        this.subscriptions.add(atom.commands.add('atom-text-editor[data-grammar~="Terraform"]', 'terraform-fmt:format', () => {
            let textEditor = atom.workspace.getActiveTextEditor();
            if (textEditor.getGrammar().scopeName != 'source.terraform') return;
            textEditor.save();
            if (!atom.config.get('terraform-fmt.fmtOnSave')) {
                this.format(textEditor.getPath());
            }
        }));
    },

    deactivate() {
        this.subscriptions.dispose();
    },

    format(file) {
        const filePath = atom.config.get('terraform-fmt.useRelativePath') ? atom.project.relativize(file) : file;
				const stdout = (output) => console.log(output);
				const stderr = (err) => console.error(err);
			  const exit = (code) => console.log("terraform-fmt: exited with code: ", code);
			  const params = Object.assign({
            command: atom.config.get('terraform-fmt.binPath'),
            args: ['fmt', filePath]
        }, atom.config.get('terraform-fmt.debugMode') ? {stdout, stderr, exit} : {});
        new BufferedProcess(params);
    }

};
