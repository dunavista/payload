import type { SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import type { ElementFormatType, NodeKey } from 'lexical'
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  Spread,
} from 'lexical'
import type { JSX } from 'react'

import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode.js'
import { $applyNodeReplacement } from 'lexical'
import * as React from 'react'

const RawUploadComponent = React.lazy(() =>
  import('../component/index.js').then((module) => ({ default: module.UploadComponent })),
)

export type UploadData = {
  fields: {
    // unknown, custom fields:
    [key: string]: unknown
  }
  relationTo: string
  value: number | string
}

function $convertUploadElement(domNode: HTMLImageElement): DOMConversionOutput | null {
  if (
    domNode.hasAttribute('data-lexical-upload-relation-to') &&
    domNode.hasAttribute('data-lexical-upload-id')
  ) {
    const id = domNode.getAttribute('data-lexical-upload-id')
    const relationTo = domNode.getAttribute('data-lexical-upload-relation-to')

    if (id != null && relationTo != null) {
      const node = $createUploadNode({
        data: {
          fields: {},
          relationTo,
          value: id,
        },
      })
      return { node }
    }
  }
  // TODO: Auto-upload functionality here!
  //}
  return null
}

export type SerializedUploadNode = Spread<UploadData, SerializedDecoratorBlockNode>

export class UploadNode extends DecoratorBlockNode {
  __data: UploadData

  constructor({
    data,
    format,
    key,
  }: {
    data: UploadData
    format?: ElementFormatType
    key?: NodeKey
  }) {
    super(format, key)
    this.__data = data
  }

  static clone(node: UploadNode): UploadNode {
    return new UploadNode({
      data: node.__data,
      format: node.__format,
      key: node.__key,
    })
  }

  static getType(): string {
    return 'upload'
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: HTMLImageElement) => ({
        conversion: $convertUploadElement,
        priority: 0,
      }),
    }
  }

  static importJSON(serializedNode: SerializedUploadNode): UploadNode {
    if (serializedNode.version === 1 && (serializedNode?.value as unknown as { id: string })?.id) {
      serializedNode.value = (serializedNode.value as unknown as { id: string }).id
    }

    const importedData: UploadData = {
      fields: serializedNode.fields,
      relationTo: serializedNode.relationTo,
      value: serializedNode.value,
    }

    const node = $createUploadNode({ data: importedData })
    node.setFormat(serializedNode.format)

    return node
  }

  static isInline(): false {
    return false
  }

  decorate(): JSX.Element {
    // @ts-expect-error
    return <RawUploadComponent data={this.__data} format={this.__format} nodeKey={this.getKey()} />
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img')
    element.setAttribute('data-lexical-upload-id', String(this.__data?.value))
    element.setAttribute('data-lexical-upload-relation-to', this.__data?.relationTo)

    return { element }
  }

  exportJSON(): SerializedUploadNode {
    return {
      ...super.exportJSON(),
      ...this.getData(),
      type: this.getType(),
      version: 2,
    }
  }

  getData(): UploadData {
    return this.getLatest().__data
  }

  setData(data: UploadData): void {
    const writable = this.getWritable()
    writable.__data = data
  }

  // eslint-disable-next-line class-methods-use-this
  updateDOM(): false {
    return false
  }
}

export function $createUploadNode({ data }: { data: UploadData }): UploadNode {
  return $applyNodeReplacement(new UploadNode({ data }))
}

export function $isUploadNode(node: LexicalNode | null | undefined): node is UploadNode {
  return node instanceof UploadNode
}